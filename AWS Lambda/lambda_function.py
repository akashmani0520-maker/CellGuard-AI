import os
import json
import boto3
import logging
from decimal import Decimal
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError, BotoCoreError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
# Optional: set IOT_ENDPOINT (e.g. xxxx-ats.iot.us-east-1.amazonaws.com) in the
# Lambda environment. Find it with: aws iot describe-endpoint --endpoint-type iot:Data-ATS
_iot_endpoint = os.environ.get('IOT_ENDPOINT')
iot_client = boto3.client(
    'iot-data',
    endpoint_url=f"https://{_iot_endpoint}" if _iot_endpoint else None
)

TABLE_TELEMETRY = dynamodb.Table('BmsTelemetry')

class DecimalEncoder(json.JSONEncoder):
    """Casts DynamoDB Decimals to JSON-compatible IEEE-754 floats."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,GET,PATCH,DELETE'
}

def build_response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': CORS_HEADERS,
        'body': body if isinstance(body, str) else json.dumps(body, cls=DecimalEncoder)
    }

def publish_mqtt_command(device_id, command_dict):
    """Returns (ok, error_detail)."""
    topic = "commands/bms/node_01" if device_id == "NANO_ESP_BMS_NODE_01" else f"commands/bms/{device_id.lower()}"
    try:
        payload = json.dumps(command_dict)
        iot_client.publish(topic=topic, qos=1, payload=payload)
        return True, None
    except ClientError as e:
        err = e.response.get('Error', {})
        detail = f"{err.get('Code')}: {err.get('Message')} (topic={topic})"
        logger.error(f"MQTT publish failed: {detail}")
        return False, detail
    except BotoCoreError as e:
        logger.error(f"MQTT publish failed: {e}")
        return False, f"{type(e).__name__}: {e}"

def lambda_handler(event, context):
    try:
        method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method')
        if method == 'OPTIONS':
            return build_response(200, '')

        query_params = event.get('queryStringParameters') or {}
        body = {}
        if event.get('body'):
            try:
                body = json.loads(event.get('body', '{}'), parse_float=Decimal)
            except json.JSONDecodeError:
                return build_response(400, {'error': 'Malformed JSON payload.'})

        device_id = query_params.get('device_id') or body.get('device_id', 'NANO_ESP_BMS_NODE_01')

        # ==========================================
        # GET: FETCH LATEST OR HISTORIC TELEMETRY
        # ==========================================
        if method == 'GET':
            enquiry = query_params.get('enquiry')
            
            # 1. Fetch Latest Telemetry Record
            if enquiry == 'latest':
                logs = TABLE_TELEMETRY.query(
                    KeyConditionExpression=Key('device_id').eq(device_id),
                    ScanIndexForward=False, # Descending order to get newest first
                    Limit=1
                ).get('Items', [])
                
                latest_item = logs[0] if logs else {}
                return build_response(200, latest_item)
            
            # 2. Fetch Historic Telemetry Records
            elif enquiry == 'history':
                start_ts = str(query_params.get('start', '0')).zfill(13)
                end_ts = str(query_params.get('end', '2147483647000')).zfill(13)
                logs = TABLE_TELEMETRY.query(
                    KeyConditionExpression=Key('device_id').eq(device_id) & Key('timestamp').between(start_ts, end_ts),
                    ScanIndexForward=True
                ).get('Items', [])
                return build_response(200, logs)
            
            else:
                return build_response(400, {'error': 'Invalid enquiry parameter. Use ?enquiry=latest or ?enquiry=history'})

        # ==========================================
        # PATCH: UPDATE RELAY STATE (MQTT Dispatch)
        # ==========================================
        elif method == 'PATCH':
            command_type = body.get('command')
            if command_type not in ['load_relay', 'charger_relay', 'clear_faults']:
                return build_response(400, {'error': 'Invalid command_type. Permitted: load_relay, charger_relay, clear_faults'})
            
            mqtt_payload = {"command": command_type}
            if command_type in ['load_relay', 'charger_relay']:
                mqtt_payload["state"] = int(body.get('state', 0))

            success, detail = publish_mqtt_command(device_id, mqtt_payload)
            if success:
                return build_response(200, {'message': 'Command published to MQTT topic successfully.', 'payload': mqtt_payload})
            else:
                return build_response(500, {'error': 'MQTT broker dispatch failure.', 'detail': detail})

        # ==========================================
        # DELETE: DECOMMISSION / PURGE RECORDS
        # ==========================================
        elif method == 'DELETE':
            timestamp_sk = query_params.get('timestamp') or body.get('timestamp')
            
            if not timestamp_sk:
                return build_response(400, {'error': 'timestamp parameter is required to delete a specific telemetry record.'})
            
            TABLE_TELEMETRY.delete_item(
                Key={
                    'device_id': device_id,
                    'timestamp': str(timestamp_sk)
                }
            )
            return build_response(200, {'message': f'Telemetry record for {device_id} at timestamp {timestamp_sk} deleted successfully.'})

        return build_response(405, {'error': 'Method Not Allowed'})

    except Exception as e:
        logger.error(f"FATAL API EXCEPTION: {str(e)}", exc_info=True)
        return build_response(500, {'error': 'Internal server error.'})
