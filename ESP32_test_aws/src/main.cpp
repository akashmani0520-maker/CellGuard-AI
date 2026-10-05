/*
 * ============================================================
 * ESP32 DUAL-PLANE BMS GATEWAY (AWS IoT Core + Local HMI)
 * MONOLITHIC BUILD
 * ============================================================
 *
 * Cloud Plane:
 *   - Wi-Fi Station (802.11 b/g/n)
 *   - NTP Timestamp Sync (Epoch validation for mTLS)
 *   - AWS IoT Core MQTT Client (Port 443 ALPN, X.509 mutual TLS)
 *   - Telemetry Publish Topic: telemetry/bms/node_01
 *   - Control Subscribe Topic: commands/bms/node_01
 *
 * Local Plane:
 *   - UART2 Hardware Serial (GPIO16 RX / GPIO17 TX @ 38400 baud)
 *   - 51-byte deterministic binary packed struct to Arduino Nano
 *   - ASCII command interface fallback for ACKs
 *
 * ============================================================
 */

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_ADS1X15.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h>

/* ============================================================
 * NETWORK & CLOUD CREDENTIALS
 * ============================================================
 */
const char* WIFI_SSID     = "Airtel_Node";
const char* WIFI_PASSWORD = "air66343";

#define DEVICE_ID "NANO_ESP_BMS_NODE_01"
#define AWS_IOT_ENDPOINT "a3ia5opqzsvf3l-ats.iot.us-east-1.amazonaws.com"
#define AWS_IOT_PORT 443

#define AWS_IOT_TOPIC_TELEMETRY "telemetry/bms/node_01"
#define AWS_IOT_TOPIC_COMMANDS  "commands/bms/node_01"

/* ============================================================
 * X.509 CRYPTOGRAPHIC PRIMITIVES
 * ============================================================
 */

// Amazon Root CA 1
static const char AWS_CERT_CA[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF
ADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6
b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTEL
MAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJv
b3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXj
ca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM
9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qw
IFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6
VOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L
93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQm
jgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMC
AYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUA
A4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDI
U5PMCCjjmCXPI6T53iHTfIUJrU6adTrCC2qJeHZERxhlbI1Bjjt/msv0tadQ1wUs
N+gDS63pYaACbvXy8MWy7Vu33PqUXHeeE6V/Uq2V8viTO96LXFvKWlJbYK8U90vv
o/ufQJVtMVT8QtPHRh8jrdkPSHCa2XV4cdFyQzR1bldZwgJcJmApzyMZFo6IQ6XU
5MsI+yMRQ+hDKXJioaldXgjUkK642M4UwtBV8ob2xJNDd2ZhwLnoQdeXeGADbkpy
rqXRfboQnoZsG4q5WTP468SQvvG5
-----END CERTIFICATE-----
)EOF";

// Device Certificate
static const char AWS_CERT_CRT[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIDWTCCAkGgAwIBAgIUS5zWaS/sKMxDDxXqfSL7yLCKnSUwDQYJKoZIhvcNAQEL
BQAwTTFLMEkGA1UECwxCQW1hem9uIFdlYiBTZXJ2aWNlcyBPPUFtYXpvbi5jb20g
SW5jLiBMPVNlYXR0bGUgU1Q9V2FzaGluZ3RvbiBDPVVTMB4XDTI2MDgyMzEyMDQy
MloXDTQ5MTIzMTIzNTk1OVowHjEcMBoGA1UEAwwTQVdTIElvVCBDZXJ0aWZpY2F0
ZTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAKxasgKK15/6BjYZtCn/
/t+flFZwTDu3qxRiGog9H2dcp9/tJnJJRSdcEPBAmnHDD79Q/PL9x3y/R4dMInO8
S1cxVC5i19jyMn8utCPYxrl2NCTxn0XFrgKS82EzDkJP82XMhZU8mJYRTCzvEqV4
Wii73sMHk0ilqCEWjxjVTBcILGOHojreyngEs8EUMR5qo9AXxh6h6jpn/iDmp+Mj
CchaRCoFZcl/KFTbfoH/3isXbVXXHQiL6EKHaaEn802CJ5CNlqmtzXNBRYyDUcO7
21ArY/5k9sZouQCsH3SnXPEfs2cuq6DadcF3A+7xdXpEfqRD3AgvUqh+fOSTQjWo
p70CAwEAAaNgMF4wHwYDVR0jBBgwFoAU/QdjNIik+X4mtm35h9u7GHiWFsAwHQYD
VR0OBBYEFK6NKk14LXfExi+C3DXddGyyQJ1lMAwGA1UdEwEB/wQCMAAwDgYDVR0P
AQH/BAQDAgeAMA0GCSqGSIb3DQEBCwUAA4IBAQCLn9UwL+eBUz2vQXu0m8WBurWK
0nnFmekoWEOhFWurr//I6t9SFJg1iFLOCxxKBaiSVEJgJe459oQhx6Thx9P47iHa
kIkeo7sHH9jgmakT0Qf9NXvJ7yjvQoAiVM6fDNthSv2DYuRFD1G/GC1Jnx7+Y8Y7
/t0xOMtGQNdnHq2Vmk631Jwjh3le9ABDeMNPKiIzZV91G36gZs592eV5UL2OIh4b
6AaNBYMqUYbYDmy4K7j10K+m+dKtFv9chJqtImc6vfprFkwKyUSpOfHorlcOD3Cf
1//1+rcO4JsTx0Z7CuF40ydf+7cWewQH0h9zRn9Ib0ygzfJi660aYl9wNYiH
-----END CERTIFICATE-----
)EOF";

// Device Private Key
static const char AWS_CERT_PRIVATE[] PROGMEM = R"EOF(
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEArFqyAorXn/oGNhm0Kf/+35+UVnBMO7erFGIaiD0fZ1yn3+0m
cklFJ1wQ8ECaccMPv1D88v3HfL9Hh0wic7xLVzFULmLX2PIyfy60I9jGuXY0JPGf
RcWuApLzYTMOQk/zZcyFlTyYlhFMLO8SpXhaKLvewweTSKWoIRaPGNVMFwgsY4ei
Ot7KeASzwRQxHmqj0BfGHqHqOmf+IOan4yMJyFpEKgVlyX8oVNt+gf/eKxdtVdcd
CIvoQodpoSfzTYInkI2Wqa3Nc0FFjINRw7vbUCtj/mT2xmi5AKwfdKdc8R+zZy6r
oNp1wXcD7vF1ekR+pEPcCC9SqH585JNCNainvQIDAQABAoIBAG/WkjfwHCbkuG8W
kr/GK360MC8+w1jkv5CEcC8DaoNJrm0xl4cFYGg/54XehdlX97nvNZP/dRjPjfyP
PLPY9RJpIfTPkrxlvLqmdaHlIl5qA0ANwYom0dk9vcvOs2v4MTpXUj8aiPCn3MQz
hef1hptz/QKUwc+cHtMJrmUw0yUFyYSSuvEllsSWGoDpzIzSJYLd9uoBERdQuRIC
sHE1xKZ5EVr1AFEsp66+TrGX0Ab3UwIRJYIX6M4rHBlO4EChaYx8AmAdH8ESt6sE
KFpxT4nQuapmsk2qPo9wBEpmOU/1rWr57MdfbHfdOAJxAjtR6oWgfS2NCW+qZGct
YKtMv0kCgYEA4GShWoeUe+GD2UshxShTXXW36oGUjHjv8dzB8WFQLUOhz9vTYuuP
njiNXYLmJYMxOvglUe7ApxbuqfA+LXv8LT1Yi1B7BCGe3nPmCaHqq8s9MWVMTNUf
8fv6T5KAzdIrp2pa2Jm9T7lYfnvT9Z7k3Dnwy+g5Tza4+RCArihO//sCgYEAxKGa
Om7wDtYwJQ1z4DBSndC3OzJhceJBD3C0KcOCz3EfIT5TLEIi3yBf6jdrSuKh+uDz
R6HDAIEv9zpHu68amEAUK7jw5+9EapnvDA/9BbLZJ8eUVNHYaNuZgWsQG1WF9al+
HX9ddy78OJD0m8yQWRWVQJvDjJWXNbrBIXdgEacCgYEAgOILsz2wUT8ERehbayxw
RXv5uN3Yfp5v4tFTK9si+/yekg7G6Ug3Yz9EIvOuUNl7i00/0kF5sf7/8eelLubJ
vwo/MzV0krjk0QxskhfH/AhuC1MNcgvvn0OFT/LrvEv8+tmheEtFaucgJvXklm0/
MiatYdDuKctajuOlpWJNjcUCgYAO0k+Zz/rwY1zFrjnp0DqqAq2NHMMTnoZg75Hl
BAO8Nz6tdtE2KNYQE5SnRv4jauniy0oLQDo+s342GIKHty8+AraChTJDiVmS33+R
XTMpVs3fnb+klRzG6qarhrJ0HQI3/kqvVoZpEXWZnfOSOt02mdXiRNt8oVoAhs9A
AouPSQKBgQCh4ulgLTia3QtQji5hLpVVa+L4VJL8Y3/ZYQ6TAVhcX79zXx2nqLTs
RfD+Rl8mantK0gyLwo8TweEyqPyZhkps85BwZU842YfDGqq/BXQAX6W2tGxU2RTf
jgpFLAv+j2mbvC8UOa6XiLbqq1R5+ms3oAAb9gwst0AoT1Lmv8USYA==
-----END RSA PRIVATE KEY-----
)EOF";

/* ============================================================
 * PACKED BINARY TELEMETRY PROTOCOL (51 Bytes)
 * ============================================================
 */
#pragma pack(push, 1)
struct BmsTelemetryPayload {
    uint8_t  startByte;         // 0xAA frame synchronizer
    float    packVoltage;       // 4 bytes
    float    packCurrent;       // 4 bytes
    float    packPower;         // 4 bytes
    float    remainingCapacity; // 4 bytes
    uint32_t cycleCount;        // 4 bytes
    float    cellVoltage[3];    // 12 bytes
    float    temperature[3];    // 12 bytes
    uint8_t  soc;               // 1 byte
    uint16_t faultFlags;        // 2 bytes
    uint16_t statusFlags;       // 2 bytes (Packed booleans)
    uint8_t  checksum;          // 1 byte (XOR verification)
} __attribute__((packed));
#pragma pack(pop)

/* ============================================================
 * PIN DEFINITIONS & HARDWARE INTERFACES
 * ============================================================
 */
#define UART_BAUD   38400
#define UART_RX_PIN 16
#define UART_TX_PIN 17

/* ============================================================
 * ANALOG ADC + 16-CHANNEL MUX PIN MAP
 * ============================================================
 * Analogue acquisition is handled by an external I2C ADS1115
 * (16-bit, 4-ch).  The ESP32's own ADC1/ADC2 pins are NOT used
 * for the signal chain.  The 4067 mux select pins (GPIO4/5/18/19)
 * remain plain digital outputs and are safe to drive while Wi-Fi
 * is active.
 *
 * Wiring (matches I2C ADC interconnect map):
 *   I2C        : SDA=GPIO21  SCL=GPIO22  (ADS1115 addr 0x48)
 *   ADS A0     : current sensor analog output
 *   ADS A1     : current sensor battery-input divider (reference)
 *   ADS A2     : 3S combined pack voltage divider
 *   ADS A3     : CD74HC4067 'Signal' output (cells + RTD comparators)
 *   Mux select : S0=GPIO4  S1=GPIO5  S2=GPIO18  S3=GPIO19
 *     C0-C2 : 3S individual cell dividers   C4-C6 : RTD comparators
 *     C9-C11: 2S individual cells (aux)      C12-C16: balanced charger (aux)
 *
 * Every *_RATIO / *_VOLT / *_PER_VOLT constant below is a documented
 * ASSUMPTION that MUST be matched to the physical divider gains and
 * sensor characteristics before field deployment.
 */
#define I2C_SDA       21
#define I2C_SCL       22
#define ADS1115_ADDR  0x48

#define ADS_CH_A0    0    /* ADS1115 A0 : current sensor output */
#define ADS_CH_A1    1    /* ADS1115 A1 : current sensor battery divider */
#define ADS_CH_A2    2    /* ADS1115 A2 : 3S combined pack divider */
#define ADS_CH_A3    3    /* ADS1115 A3 : 4067 Signal output (cells / RTD) */
#define ADS_CH_MUX   ADS_CH_A3

/* ADS1115 is configured with GAIN_ONE, i.e. +/-4.096 V full scale.
 * ADC_REF_VOLTAGE below is only used as an upper "sensor slammed to
 * rail" fault threshold, not for raw->volt scaling. */
#define ADC_REF_VOLTAGE    3.3f    /* sensor validity upper rail (V) */
#define ADC_MUX_SWITCH_US  2500U   /* 4067 settle after channel change */
#define ADC_SAMPLES        8       /* single-ended reads averaged per value */

#define MUX_S0 4                  /* d4   (LSB) */
#define MUX_S1 5                  /* d5        */
#define MUX_S2 18                 /* d18       */
#define MUX_S3 19                 /* d19  (MSB) */

#define MUX_CH_CELL0   0          /* C0  cell 1 divider */
#define MUX_CH_CELL1   1          /* C1  cell 2 divider */
#define MUX_CH_CELL2   2          /* C2  cell 3 divider */
#define MUX_CH_RTD0    4          /* C4  RTD comparator 1 */
#define MUX_CH_RTD1    5          /* C5  RTD comparator 2 */
#define MUX_CH_RTD2    6          /* C6  RTD comparator 3 */
#define MUX_CH_CELL2S_0  9        /* C9  2S cell A (aux) */
#define MUX_CH_CELL2S_1 10        /* C10 2S cell B (aux) */
#define MUX_CH_CELLCHG_0 12       /* C12 balanced-charger cell 1 (aux) */
#define MUX_CH_CELLCHG_1 13       /* C13 balanced-charger cell 2 (aux) */
#define MUX_CH_CELLCHG_2 14       /* C14 balanced-charger cell 3 (aux) */

/* Divider gains: multiply ADC-recovered volts to true circuit volts. */
#define PACK_DIVIDER_RATIO    4.0f /* A2  : 3S combined divider */
#define CELL_DIVIDER_RATIO    2.0f /* C0-2: cell divider (4.2V -> ~2.1V ADC) */
#define CURRENT_DIVIDER_RATIO 4.0f /* A1  : battery input divider at sensor */

/* Current sensor linear model (A0):  I[A] = (Vout - zero) * A_per_V */
#define CURRENT_ZERO_VOLT    2.50f
#define CURRENT_AMP_PER_VOLT 10.0f

/* RTD comparator linear model (C4-6):  T[C] = off + V * deg_per_V */
#define RTD_OFFSET_C        -20.0f
#define RTD_DEG_PER_VOLT    30.0f

/* Minimum plausible recovered volts; below this a pick-off is treated as
 * a disconnected sensor/cell. */
#define MIN_PACK_VOLTS   5.0f
#define MIN_CELL_VOLTS   1.0f

/* Nominal design capacity used to normalize State of Health.
 * MUST be set to the pack's rated capacity (Ah) before deployment. */
#define BATTERY_DESIGN_CAPACITY_AH 10.0f

HardwareSerial NanoUART(2);
WiFiClientSecure netClient;
PubSubClient mqttClient(netClient);

Adafruit_ADS1115 ads;   /* external I2C 16-bit ADC used for all acquisition */

/* ============================================================
 * BUFFER & TIMING STATE
 * ============================================================
 */
constexpr uint16_t RX_BUFFER_SIZE = 128;
char rxBuffer[RX_BUFFER_SIZE];
uint16_t rxIndex = 0;

constexpr uint32_t ANALOG_READ_INTERVAL_MS  = 1000;
constexpr uint32_t AWS_PUBLISH_INTERVAL_MS   = 15000;

uint32_t lastAnalogRead = 0;
uint32_t lastAwsPublish = 0;
uint32_t lastEnergyMs    = 0;   /* last coulomb/Wh integration tick */

static uint16_t g_prevFaultFlags = 0; /* edge-detect for fault latch */

/* ============================================================
 * FAULT DEFINITIONS & SYSTEM STRUCTS
 * ============================================================
 */
enum FaultFlags : uint16_t {
    FAULT_NONE           = 0,
    FAULT_CELL_OV        = (1 << 0),
    FAULT_CELL_UV        = (1 << 1),
    FAULT_PACK_OV        = (1 << 2),
    FAULT_PACK_UV        = (1 << 3),
    FAULT_CHARGE_OC      = (1 << 4),
    FAULT_DISCHARGE_OC   = (1 << 5),
    FAULT_SHORT          = (1 << 6),
    FAULT_CHARGE_OT      = (1 << 7),
    FAULT_DISCHARGE_OT   = (1 << 8),
    FAULT_CHARGE_UT      = (1 << 9),
    FAULT_TEMP_SENSOR    = (1 << 10),
    FAULT_CELL_SENSOR    = (1 << 11),
    FAULT_CURRENT_SENSOR = (1 << 12),
    FAULT_CONFIG         = (1 << 13)
};

struct MockBms {
    float packVoltage;
    float packCurrent;
    float packPower;
    uint8_t soc;
    float remainingCapacity;
    uint32_t cycleCount;
    float cellVoltage[3];
    float maxCellVoltage;
    float minCellVoltage;
    float cellDelta;
    float temperature[3];
    bool chargerRelay;
    bool loadRelay;
    bool chargerDetected;
    bool loadDetected;
    bool charging;
    bool cellCharging[3];
    bool cellFull[3];
    uint16_t faultFlags;
    /* --- Energy / lifecycle analytics (see integration below) --- */
    float ampHoursIn;        // cumulative charge inserted [Ah]
    float ampHoursOut;       // cumulative discharge removed [Ah]
    float energyInWh;        // cumulative charging energy [Wh]
    float energyOutWh;       // cumulative discharging energy [Wh]
    float fullCapacityAh;    // present full capacity [Ah] (SoH basis)
    float soh;               // State of Health [%]
    uint32_t faultCount;     // number of distinct new-fault events latched
    uint32_t lastFaultTime;  // epoch seconds of most recent new-fault latch
    uint16_t lastFaultFlags; // bitmask latched when a new fault appeared
    bool bmsOnline;
    bool esp32Online;
    bool wifiOnline;
    bool awsOnline;
};

MockBms bms;

/* ============================================================
 * FORWARD DECLARATIONS
 * ============================================================
 */
void updateDerivedValues();
void integrateEnergy(float dtSec);
void updateFaultHistory();
void sendSnapshotToNano();
void sendErrorToNano(const char *reason);
void publishTelemetryToAWS();

/* ============================================================
 * ANALOG ADC + 16-CHANNEL MUX SCANNER (REAL TELEMETRY)
 * ============================================================
 */

static float readAdcChannel(uint8_t channel) {
    float sum = 0.0f;
    for (uint8_t i = 0; i < ADC_SAMPLES; i++) {
        sum += ads.computeVolts(ads.readADC_SingleEnded(channel));
        delayMicroseconds(100);
    }
    return sum / (float)ADC_SAMPLES;
}

static void muxSelect(uint8_t channel) {
    digitalWrite(MUX_S0, channel & 0x01);
    digitalWrite(MUX_S1, (channel >> 1) & 0x01);
    digitalWrite(MUX_S2, (channel >> 2) & 0x01);
    digitalWrite(MUX_S3, (channel >> 3) & 0x01);
    delayMicroseconds(ADC_MUX_SWITCH_US);
}

static float readMuxChannel(uint8_t channel) {
    muxSelect(channel);
    return readAdcChannel(ADS_CH_MUX);
}

void initAnalogHardware() {
    // External I2C ADS1115 ADC (SDA/SCL defined above).
    Wire.begin(I2C_SDA, I2C_SCL);

    if (!ads.begin(ADS1115_ADDR)) {
        Serial.println("[ADC] ADS1115 not found on I2C - check SDA/SCL wiring!");
        bms.faultFlags |= FAULT_CURRENT_SENSOR; /* flag acquisition failure */
    } else {
        ads.setGain(GAIN_ONE);          /* +/-4.096 V single-ended range */
        ads.setDataRate(RATE_ADS1115_860SPS);
        Serial.println("[ADC] ADS1115 initialized (gain +/-4.096V @ 860 SPS).");
    }

    // 4067 mux select outputs are plain digital pins; keep them.
    pinMode(MUX_S0, OUTPUT);
    pinMode(MUX_S1, OUTPUT);
    pinMode(MUX_S2, OUTPUT);
    pinMode(MUX_S3, OUTPUT);
    muxSelect(0);
}

/* ============================================================
 * ENERGY / LIFECYCLE ANALYTICS (ITEM 3)
 * ============================================================
 * Numerical integration of measured pack current and power over
 * wall-clock time.  Positive packCurrent = charging, negative =
 * discharging.  dtSec is the elapsed time since the previous scan.
 */
void integrateEnergy(float dtSec) {
    if (dtSec <= 0.0f) return;

    float I = bms.packCurrent;
    float P = fabs(bms.packVoltage * I);   /* magnitude of power flow [W] */

    if (I > 0.0f) {            /* charging direction */
        bms.ampHoursIn  += I * dtSec;
        bms.energyInWh  += P * dtSec;
    } else {                   /* discharging direction */
        bms.ampHoursOut += -I * dtSec;
        bms.energyOutWh += P * dtSec;
    }
}

/* Edge-detect on the fault bitmask: whenever new bit(s) go high we
 * record a fault event (count + timestamp + which flags appeared).
 * This distinguishes "what latched now" from the full current mask. */
void updateFaultHistory() {
    uint16_t newFaults = bms.faultFlags & ~g_prevFaultFlags;
    if (newFaults != 0) {
        bms.faultCount++;
        bms.lastFaultFlags = newFaults;
        bms.lastFaultTime  = (uint32_t)time(nullptr);
    }
    g_prevFaultFlags = bms.faultFlags;
}

void updateAnalogTelemetry() {
    uint32_t now = millis();
    if (now - lastAnalogRead < ANALOG_READ_INTERVAL_MS) return;
    lastAnalogRead = now;

    // --- Direct ADC lines (ADS1115) ------------------------------------
    float packV  = readAdcChannel(ADS_CH_A2) * PACK_DIVIDER_RATIO;    // A2 3S pack
    float curOut = readAdcChannel(ADS_CH_A0);                          // A0 sensor out
    float curVin = readAdcChannel(ADS_CH_A1) * CURRENT_DIVIDER_RATIO;  // A1 sensor input

    // --- Mux channels (via A3) -------------------------------------------
    float c1 = readMuxChannel(MUX_CH_CELL0) * CELL_DIVIDER_RATIO;
    float c2 = readMuxChannel(MUX_CH_CELL1) * CELL_DIVIDER_RATIO;
    float c3 = readMuxChannel(MUX_CH_CELL2) * CELL_DIVIDER_RATIO;
    float t1 = readMuxChannel(MUX_CH_RTD0);
    float t2 = readMuxChannel(MUX_CH_RTD1);
    float t3 = readMuxChannel(MUX_CH_RTD2);

    // --- Aux channels (2S + balanced charger), monitored on serial -------
    float c2sA = readMuxChannel(MUX_CH_CELL2S_0) * CELL_DIVIDER_RATIO;
    float c2sB = readMuxChannel(MUX_CH_CELL2S_1) * CELL_DIVIDER_RATIO;
    float ccA  = readMuxChannel(MUX_CH_CELLCHG_0) * CELL_DIVIDER_RATIO;
    float ccB  = readMuxChannel(MUX_CH_CELLCHG_1) * CELL_DIVIDER_RATIO;
    float ccC  = readMuxChannel(MUX_CH_CELLCHG_2) * CELL_DIVIDER_RATIO;

    // --- Write the primary 3S pack into the telemetry model --------------
    bms.cellVoltage[0] = c1;
    bms.cellVoltage[1] = c2;
    bms.cellVoltage[2] = c3;

    bms.packVoltage = packV;
    bms.packCurrent = (curOut - CURRENT_ZERO_VOLT) * CURRENT_AMP_PER_VOLT;

    bms.temperature[0] = RTD_OFFSET_C + t1 * RTD_DEG_PER_VOLT;
    bms.temperature[1] = RTD_OFFSET_C + t2 * RTD_DEG_PER_VOLT;
    bms.temperature[2] = RTD_OFFSET_C + t3 * RTD_DEG_PER_VOLT;

    // Coulomb / energy integration across this sample period.
    uint32_t nowMs = millis();
    float dtSec   = (lastEnergyMs == 0) ? 0.0f
                                          : (float)(nowMs - lastEnergyMs) / 1000.0f;
    lastEnergyMs  = nowMs;
    integrateEnergy(dtSec);

    // --- Sensor health: assert plausible ranges --------------------------
    bms.faultFlags &= ~(FAULT_CELL_SENSOR | FAULT_CURRENT_SENSOR | FAULT_TEMP_SENSOR);
    if (packV < MIN_PACK_VOLTS || c1 < MIN_CELL_VOLTS || c2 < MIN_CELL_VOLTS || c3 < MIN_CELL_VOLTS)
        bms.faultFlags |= FAULT_CELL_SENSOR;
    if (curOut <= 0.02f || curOut >= ADC_REF_VOLTAGE - 0.02f)
        bms.faultFlags |= FAULT_CURRENT_SENSOR;
    if (t1 <= 0.05f || t2 <= 0.05f || t3 <= 0.05f)
        bms.faultFlags |= FAULT_TEMP_SENSOR;

    updateFaultHistory();
    updateDerivedValues();

    Serial.printf("[ADC] pack=%.2f c1=%.3f c2=%.3f c3=%.3f I=%.2f T=%.1f/%.1f/%.1f | 2S=%.2f/%.2f chg=%.2f/%.2f/%.2f vin=%.2f\n",
                  packV, c1, c2, c3, bms.packCurrent,
                  bms.temperature[0], bms.temperature[1], bms.temperature[2],
                  c2sA, c2sB, ccA, ccB, ccC, curVin);
}

/* ============================================================
 * STATE MACHINE & SIMULATION
 * ============================================================
 */
void initialiseSystem() {
    memset(&bms, 0, sizeof(bms));

    initAnalogHardware();

    bms.soc = 0;
    bms.remainingCapacity = 0.0f;
    bms.cycleCount = 0;

    bms.loadRelay = false;
    bms.chargerRelay = false;
    bms.loadDetected = false;
    bms.chargerDetected = false;
    bms.charging = false;

    for (uint8_t i = 0; i < 3; i++) {
        bms.cellCharging[i] = false;
        bms.cellFull[i] = false;
    }

    bms.faultFlags = FAULT_NONE;
    bms.bmsOnline = true;
    bms.esp32Online = true;
    bms.wifiOnline = false;
    bms.awsOnline = false;

    // Energy / lifecycle counters -> clean starting state.
    bms.ampHoursIn = 0.0f;
    bms.ampHoursOut = 0.0f;
    bms.energyInWh = 0.0f;
    bms.energyOutWh = 0.0f;
    bms.fullCapacityAh = BATTERY_DESIGN_CAPACITY_AH;
    bms.soh = 100.0f;
    bms.faultCount = 0;
    bms.lastFaultTime = 0;
    bms.lastFaultFlags = FAULT_NONE;
    g_prevFaultFlags = FAULT_NONE;
    lastEnergyMs = 0;

    updateDerivedValues();
}

void updateDerivedValues() {
    bms.packVoltage = bms.cellVoltage[0] + bms.cellVoltage[1] + bms.cellVoltage[2];
    bms.maxCellVoltage = max(bms.cellVoltage[0], max(bms.cellVoltage[1], bms.cellVoltage[2]));
    bms.minCellVoltage = min(bms.cellVoltage[0], min(bms.cellVoltage[1], bms.cellVoltage[2]));
    bms.cellDelta = bms.maxCellVoltage - bms.minCellVoltage;
    bms.packPower = bms.packVoltage * bms.packCurrent;
    bms.charging = bms.chargerRelay && bms.chargerDetected;

    // State of Health = present full capacity / rated design capacity.
    float capRatio = (BATTERY_DESIGN_CAPACITY_AH > 0.0f)
                         ? bms.fullCapacityAh / BATTERY_DESIGN_CAPACITY_AH : 0.0f;
    bms.soh = constrain(capRatio * 100.0f, 0.0f, 100.0f);

    for (uint8_t i = 0; i < 3; i++) {
        bms.cellCharging[i] = bms.charging && !bms.cellFull[i];
    }
}

// Telemetry is now produced by updateAnalogTelemetry() from live
// ADC / mux readings (see ANALOG ADC + MUX SCANNER above).

/* ============================================================
 * UART2 COMMUNICATIONS (Nano Local Plane)
 * ============================================================
 */
void sendSnapshotToNano() {
    BmsTelemetryPayload payload;
    memset(&payload, 0, sizeof(payload));

    payload.startByte = 0xAA;
    payload.packVoltage = bms.packVoltage;
    payload.packCurrent = bms.packCurrent;
    payload.packPower = bms.packPower;
    payload.remainingCapacity = bms.remainingCapacity;
    payload.cycleCount = bms.cycleCount;
    payload.soc = bms.soc;
    payload.faultFlags = bms.faultFlags;

    for (uint8_t i = 0; i < 3; i++) {
        payload.cellVoltage[i] = bms.cellVoltage[i];
        payload.temperature[i] = bms.temperature[i];
    }

    uint16_t flags = 0;
    if (bms.chargerRelay)    flags |= (1 << 0);
    if (bms.loadRelay)       flags |= (1 << 1);
    if (bms.chargerDetected) flags |= (1 << 2);
    if (bms.loadDetected)    flags |= (1 << 3);
    if (bms.charging)        flags |= (1 << 4);
    if (bms.cellCharging[0]) flags |= (1 << 5);
    if (bms.cellFull[0])     flags |= (1 << 6);
    if (bms.cellCharging[1]) flags |= (1 << 7);
    if (bms.cellFull[1])     flags |= (1 << 8);
    if (bms.cellCharging[2]) flags |= (1 << 9);
    if (bms.cellFull[2])     flags |= (1 << 10);
    if (bms.bmsOnline)       flags |= (1 << 11);
    if (bms.esp32Online)     flags |= (1 << 12);
    if (bms.wifiOnline)      flags |= (1 << 13);
    payload.statusFlags = flags;

    uint8_t* ptr = (uint8_t*)&payload;
    uint8_t crc = 0;
    for (size_t i = 0; i < sizeof(payload) - 1; i++) {
        crc ^= ptr[i];
    }
    payload.checksum = crc;

    NanoUART.write((uint8_t*)&payload, sizeof(payload));
}

void sendErrorToNano(const char *reason) {
    NanoUART.print("ERR|");
    NanoUART.println(reason);
}

void handleLoadCommand(bool state) {
    bms.loadRelay = state;
    updateDerivedValues();
    NanoUART.print("ACK|LOAD|");
    NanoUART.println(bms.loadRelay ? 1 : 0);
}

void handleChargerCommand(bool state) {
    bool chargingFault = (bms.faultFlags & (FAULT_CELL_OV | FAULT_CHARGE_OC | FAULT_CHARGE_OT | FAULT_CHARGE_UT));
    if (state && chargingFault) {
        sendErrorToNano("CHARGER_BLOCKED");
        return;
    }
    bms.chargerRelay = state;
    updateDerivedValues();
    NanoUART.print("ACK|CHARGER|");
    NanoUART.println(bms.chargerRelay ? 1 : 0);
}

void handleClearFaults() {
    bms.faultFlags = FAULT_NONE;
    NanoUART.println("ACK|CLEAR_FAULTS");
}

void processNanoCommand(char *line) {
    if (line == nullptr || line[0] == '\0') return;

    if (strcmp(line, "GET|SNAPSHOT") == 0) {
        updateDerivedValues();
        sendSnapshotToNano();
        return;
    }
    if (strncmp(line, "CMD|LOAD|", 9) == 0) {
        handleLoadCommand(atoi(line + 9) != 0);
        return;
    }
    if (strncmp(line, "CMD|CHARGER|", 12) == 0) {
        handleChargerCommand(atoi(line + 12) != 0);
        return;
    }
    if (strcmp(line, "CMD|CLEAR_FAULTS") == 0) {
        handleClearFaults();
        return;
    }
}

void updateNanoUART() {
    while (NanoUART.available()) {
        char c = NanoUART.read();
        if (c == '\n') {
            rxBuffer[rxIndex] = '\0';
            if (rxIndex > 0) {
                processNanoCommand(rxBuffer);
            }
            rxIndex = 0;
            continue;
        }
        if (c == '\r') continue;
        if (rxIndex < RX_BUFFER_SIZE - 1) rxBuffer[rxIndex++] = c;
        else rxIndex = 0;
    }
}

/* ============================================================
 * AWS IoT MQTT COMMAND CALLBACK (Cloud Plane)
 * ============================================================
 */
void onMqttMessage(char* topic, byte* payload, unsigned int length) {
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, payload, length);

    if (error) {
        Serial.printf("[MQTT] JSON parse failed: %s\n", error.c_str());
        return;
    }

    const char* command = doc["command"];
    if (!command) return;

    if (strcmp(command, "load_relay") == 0) {
        int state = doc["state"] | 0;
        handleLoadCommand(state != 0);
    } 
    else if (strcmp(command, "charger_relay") == 0) {
        int state = doc["state"] | 0;
        handleChargerCommand(state != 0);
    } 
    else if (strcmp(command, "clear_faults") == 0) {
        handleClearFaults();
    }

    publishTelemetryToAWS();
}

/* ============================================================
 * AWS TELEMETRY SERIALIZER (JSON)
 * ============================================================
 */
void publishTelemetryToAWS() {
    if (!mqttClient.connected()) return;

    StaticJsonDocument<1024> doc;
    doc["device_id"]          = DEVICE_ID;
    doc["pack_voltage"]       = serialized(String(bms.packVoltage, 2));
    doc["pack_current"]       = serialized(String(bms.packCurrent, 2));
    doc["pack_power"]         = serialized(String(bms.packPower, 2));
    doc["soc"]                = bms.soc;
    doc["remaining_capacity"] = serialized(String(bms.remainingCapacity, 2));
    doc["cycle_count"]        = bms.cycleCount;

    // --- Battery / energy analytics (item 3) ---------------------------
    doc["amp_hours_in"]     = serialized(String(bms.ampHoursIn, 2));
    doc["amp_hours_out"]    = serialized(String(bms.ampHoursOut, 2));
    doc["energy_in_wh"]     = serialized(String(bms.energyInWh, 2));
    doc["energy_out_wh"]    = serialized(String(bms.energyOutWh, 2));
    doc["full_capacity_ah"] = serialized(String(bms.fullCapacityAh, 2));
    doc["soh_percent"]      = serialized(String(bms.soh, 1));

    // --- Fault history ---------------------------------------------------
    doc["fault_count"]       = bms.faultCount;
    doc["last_fault_flags"]  = bms.lastFaultFlags;
    doc["last_fault_epoch"]  = bms.lastFaultTime;

    JsonArray cellArr = doc.createNestedArray("cell_voltage");
    for (uint8_t i = 0; i < 3; i++) {
        cellArr.add(serialized(String(bms.cellVoltage[i], 3)));
    }

    // Cell drift is represented by the max-min delta across the pack.
    doc["max_cell_voltage"] = serialized(String(bms.maxCellVoltage, 3));
    doc["min_cell_voltage"] = serialized(String(bms.minCellVoltage, 3));
    doc["cell_delta"]       = serialized(String(bms.cellDelta, 3));
    doc["drift"]            = serialized(String(bms.cellDelta, 3));

    JsonArray tempArr = doc.createNestedArray("temperature");
    for (uint8_t i = 0; i < 3; i++) {
        tempArr.add(serialized(String(bms.temperature[i], 1)));
    }

    doc["charger_relay"]    = bms.chargerRelay;
    doc["load_relay"]       = bms.loadRelay;
    doc["charger_detected"] = bms.chargerDetected;
    doc["load_detected"]    = bms.loadDetected;
    doc["charging"]         = bms.charging;
    doc["fault_flags"]      = bms.faultFlags;
    doc["bms_online"]       = bms.bmsOnline;
    doc["wifi_online"]      = bms.wifiOnline;
    doc["aws_online"]       = bms.awsOnline;

    // --- Cheap system/network health (non-blocking reads) --------------
    doc["rssi"]             = WiFi.RSSI();
    doc["uptime_ms"]        = millis();

    char jsonBuffer[1024];
    size_t len = serializeJson(doc, jsonBuffer, sizeof(jsonBuffer));

    if (!mqttClient.publish(AWS_IOT_TOPIC_TELEMETRY, jsonBuffer, len)) {
        Serial.println("[MQTT] Telemetry publish failed. (len=" + String(len) + ")");
    }
}

/* ============================================================
 * NETWORK SYNCHRONIZATION (NTP & mTLS)
 * ============================================================
 */
void syncNTP() {
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
    time_t now = time(nullptr);
    while (now < 1672531200) {
        delay(500);
        now = time(nullptr);
    }
    Serial.println("[NTP] Time synchronized.");
}

void connectWiFi() {
    if (WiFi.status() == WL_CONNECTED) return;

    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    uint8_t retries = 0;
    while (WiFi.status() != WL_CONNECTED && retries < 30) {
        delay(500);
        retries++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        bms.wifiOnline = true;
        Serial.printf("[NET] Connected, IP: %s\n", WiFi.localIP().toString().c_str());
        syncNTP();
    } else {
        bms.wifiOnline = false;
        Serial.println("[NET] Wi-Fi connection failed.");
    }
}

void connectAWS() {
    if (!bms.wifiOnline || mqttClient.connected()) return;

    netClient.setCACert(AWS_CERT_CA);
    netClient.setCertificate(AWS_CERT_CRT);
    netClient.setPrivateKey(AWS_CERT_PRIVATE);

    netClient.setAlpnProtocols(new const char* [2] {"x-amzn-mqtt-ca", NULL});

    mqttClient.setServer(AWS_IOT_ENDPOINT, AWS_IOT_PORT);
    mqttClient.setCallback(onMqttMessage);
    mqttClient.setBufferSize(1024);

    if (mqttClient.connect(DEVICE_ID)) {
        bms.awsOnline = true;
        mqttClient.subscribe(AWS_IOT_TOPIC_COMMANDS);
        Serial.println("[CLOUD] AWS IoT Core connected, subscribed to commands.");
    } else {
        bms.awsOnline = false;
        Serial.printf("[CLOUD] MQTT connection failed (rc=%d)\n", mqttClient.state());

        char err_buf[100];
        if (netClient.lastError(err_buf, sizeof(err_buf)) < 0) {
            Serial.printf("[TLS] %s\n", err_buf);
        }
    }
}

/* ============================================================
 * SETUP & MAIN LOOP
 * ============================================================
 */
void setup() {
    Serial.begin(115200);
    NanoUART.begin(UART_BAUD, SERIAL_8N1, UART_RX_PIN, UART_TX_PIN);
    delay(500);

    initialiseSystem();

    Serial.println("[BOOT] ESP32 BMS Gateway initialized.");

    connectWiFi();
    connectAWS();
}

void loop() {
    updateNanoUART();

    if (WiFi.status() == WL_CONNECTED) {
        bms.wifiOnline = true;
        if (!mqttClient.connected()) {
            bms.awsOnline = false;
            connectAWS();
        } else {
            bms.awsOnline = true;
            mqttClient.loop();
        }
    } else {
        bms.wifiOnline = false;
        bms.awsOnline = false;
        connectWiFi();
    }

    updateAnalogTelemetry();

    uint32_t now = millis();
    if (now - lastAwsPublish >= AWS_PUBLISH_INTERVAL_MS) {
        lastAwsPublish = now;
        publishTelemetryToAWS();
    }
}