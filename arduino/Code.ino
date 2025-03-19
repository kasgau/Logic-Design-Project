#include <LiquidCrystal_I2C.h>
#include <PubSubClient.h>
#include "DHT.h"
#include <ESPmDNS.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>
#include <ESPmDNS.h>
#include <WiFi.h>
#include <WiFiClient.h>
#include <HTTPClient.h>
#include <WebServer.h>

#define FAN_PWM_PIN    9
#define PWM_FREQ 25000
#define PWM_RESOLUTION 8
#define PWM_CHANNEL 0 
#define DHTTYPE DHT11
#define DHTPin 32

#define BUZZER_PIN 25
#define FLAME_PIN 27
DHT dht(DHTPin, DHTTYPE);

int lcdColumns = 16;
int lcdRows = 2;

LiquidCrystal_I2C lcd(0x27, lcdColumns, lcdRows);

const int MQ_PIN = 34;
int RL_VALUE = 1;
float RO_CLEAN_AIR_FACTOR = 9.83;

int CALIBARAION_SAMPLE_TIMES = 50;
int CALIBRATION_SAMPLE_INTERVAL = 500;
int READ_SAMPLE_INTERVAL = 50;
int READ_SAMPLE_TIMES = 5;
WebServer server(80);

#define GAS_LPG 0
#define GAS_CO 1
#define GAS_SMOKE 2

float LPGCurve[3] = {2.3, 0.21, -0.47};
float COCurve[3] = {2.3, 0.72, -0.34};
float SmokeCurve[3] = {2.3, 0.53, -0.44};
float Ro = 10;
float MQResistanceCalculation(int raw_adc)
{
  return ( ((float)RL_VALUE*(1023-raw_adc)/raw_adc));
}
 
/***************************** MQCalibration ****************************************
Input:   mq_pin - analog channel
Output:  Ro of the sensor
Remarks: This function assumes that the sensor is in clean air. It use  
         MQResistanceCalculation to calculates the sensor resistance in clean air 
         and then divides it with RO_CLEAN_AIR_FACTOR. RO_CLEAN_AIR_FACTOR is about 
         10, which differs slightly between different sensors.
************************************************************************************/ 
float MQCalibration(int mq_pin)
{
  int i;
  float val=0;
 
  for (i=0;i<CALIBARAION_SAMPLE_TIMES;i++) {            //take multiple samples
    val += MQResistanceCalculation(analogRead(mq_pin));
    delay(CALIBRATION_SAMPLE_INTERVAL);
  }
  val = val/CALIBARAION_SAMPLE_TIMES;                   //calculate the average value
 
  val = val/RO_CLEAN_AIR_FACTOR;                        //divided by RO_CLEAN_AIR_FACTOR yields the Ro 
                                                        //according to the chart in the datasheet 
 
  return val; 
}
/*****************************  MQRead *********************************************
Input:   mq_pin - analog channel
Output:  Rs of the sensor
Remarks: This function use MQResistanceCalculation to caculate the sensor resistenc (Rs).
         The Rs changes as the sensor is in the different consentration of the target
         gas. The sample times and the time interval between samples could be configured
         by changing the definition of the macros.
************************************************************************************/ 
float MQRead(int mq_pin)
{
  int i;
  float rs=0;
 
  for (i=0;i<READ_SAMPLE_TIMES;i++) {
    rs += MQResistanceCalculation(analogRead(mq_pin));
    delay(READ_SAMPLE_INTERVAL);
  }
 
  rs = rs/READ_SAMPLE_TIMES;
 
  return rs;  
}
 
/*****************************  MQGetGasPercentage **********************************
Input:   rs_ro_ratio - Rs divided by Ro
         gas_id      - target gas type
Output:  ppm of the target gas
Remarks: This function passes different curves to the MQGetPercentage function which 
         calculates the ppm (parts per million) of the target gas.
************************************************************************************/ 
int MQGetGasPercentage(float rs_ro_ratio, int gas_id)
{
  if ( gas_id == GAS_LPG ) {
     return MQGetPercentage(rs_ro_ratio,LPGCurve);
  } else if ( gas_id == GAS_CO ) {
     return MQGetPercentage(rs_ro_ratio,COCurve);
  } else if ( gas_id == GAS_SMOKE ) {
     return MQGetPercentage(rs_ro_ratio,SmokeCurve);
  }    
 
  return 0;
}
 
/*****************************  MQGetPercentage **********************************
Input:   rs_ro_ratio - Rs divided by Ro
         pcurve      - pointer to the curve of the target gas
Output:  ppm of the target gas
Remarks: By using the slope and a point of the line. The x(logarithmic value of ppm) 
         of the line could be derived if y(rs_ro_ratio) is provided. As it is a 
         logarithmic coordinate, power of 10 is used to convert the result to non-logarithmic 
         value.
************************************************************************************/ 
int  MQGetPercentage(float rs_ro_ratio, float *pcurve)
{
  return (pow(10,( ((log(rs_ro_ratio)-pcurve[1])/pcurve[2]) + pcurve[0])));
}






const char* ssid = "Ninanin";
const char* password = "Keypass246";

// Backend endpoints
const char* DHT_endpoint = "http://192.168.1.6:5000/dht-data";
const char* MQ_endpoint = "http://192.168.1.6:5000/mq-data";

void setup_wifi() {
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("WiFi connected - ESP IP address: ");
  Serial.println(WiFi.localIP());
}



void handleDHTData() {
  float humidity = dht.readHumidity();
  float temperatureC = dht.readTemperature();

  if (isnan(humidity) || isnan(temperatureC)) {
    server.send(500, "application/json", "{\"error\":\"Failed to read DHT sensor\"}");
    return;
  }

  DynamicJsonDocument dhtDoc(128);
  dhtDoc["humidity"] = humidity;
  dhtDoc["temperatureC"] = temperatureC;

  String response;
  serializeJson(dhtDoc, response);
  server.send(200, "application/json", response);
}

void handleMQData() {
  float rs_ro_ratio = MQRead(MQ_PIN) / Ro;

  DynamicJsonDocument mqDoc(128);
  mqDoc["lpg"] = MQGetPercentage(rs_ro_ratio, new float[3]{2.3, 0.21, -0.47});
  mqDoc["co"] = MQGetPercentage(rs_ro_ratio, new float[3]{2.3, 0.72, -0.34});
  mqDoc["smoke"] = MQGetPercentage(rs_ro_ratio, new float[3]{2.3, 0.53, -0.44});
  mqDoc["flameStatus"] = digitalRead(FLAME_PIN);

  String response;
  serializeJson(mqDoc, response);
  server.send(200, "application/json", response);
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  setup_wifi();
    // initialize LCD
  lcd.init();
  // turn on LCD backlight                      
  lcd.backlight();

  pinMode(BUZZER_PIN, OUTPUT); // Set the buzzer pin as output
  pinMode(FLAME_PIN, INPUT);   // Set the flame sensor pin as input

  Ro = MQCalibration(MQ_PIN);
  Serial.printf("Calibration done. Ro=%f\n", Ro);

  server.on("/dht-data", handleDHTData);
  server.on("/mq-data", handleMQData);

  server.begin();
  Serial.println("HTTP server started.");
}

unsigned long previousMillis = 0;

void loop() {
  server.handleClient();
    int flameStatus = digitalRead(FLAME_PIN); // Read the flame sensor status
  unsigned long currentMillis = millis();

  // Update every second
  if (currentMillis - previousMillis > 1000) {
    previousMillis = currentMillis;

    // Sensor Readings
    float humidity = dht.readHumidity();
    float temperatureC = dht.readTemperature();
    float rs_ro_ratio = MQRead(MQ_PIN) / Ro;
    int lpg = MQGetGasPercentage(rs_ro_ratio, GAS_LPG);
    int co = MQGetGasPercentage(rs_ro_ratio, GAS_CO);
    int smoke = MQGetGasPercentage(rs_ro_ratio, GAS_SMOKE);

    // Handle errors
    if (isnan(humidity) || isnan(temperatureC)) {
      Serial.println("Failed to read from DHT sensor!");
      return;
    }

    // Gas thresholds
    int lpg_threshold = 10;
    int co_threshold = 10;
    int smoke_threshold = 10;

    // LCD Updates - Avoid flicker
    lcd.setCursor(0, 0);
    lcd.print("Air:");
    if (lpg > lpg_threshold || co > co_threshold || smoke > smoke_threshold) {
      lcd.setCursor(4, 0);
      lcd.print("NO  "); // "NO" indicates bad air quality
      int duty = 0;
      if (lpg > co && lpg > smoke) {
        duty = map(lpg, lpg_threshold, 100, 128, 255);
      } else if (co > lpg && co > smoke) {
        duty = map(co, co_threshold, 100, 128, 255);
      } else {
        duty = map(smoke, smoke_threshold, 100, 128, 255);
      }
      analogWrite(FAN_PWM_PIN, duty); // Turn on fan
    } else {
      lcd.setCursor(4, 0);
      lcd.print("OK  "); // "OK" indicates good air quality
      analogWrite(FAN_PWM_PIN, 0); // Turn off fan
    }

    // Fire alert
    if (flameStatus == 0) {
      digitalWrite(BUZZER_PIN, LOW); // Activate buzzer
      lcd.setCursor(0, 1);
      lcd.print("Fire!");
    } else {
      digitalWrite(BUZZER_PIN, HIGH); // Deactivate buzzer
      lcd.setCursor(0, 1);
      lcd.print("GOOD");
    }

    // Update Humidity and Temperature
    lcd.setCursor(7, 0);
    lcd.print("HUM:");
    lcd.print(humidity, 1);
    lcd.print("%");

    lcd.setCursor(7, 1);
    lcd.print("TEM:");
    lcd.print(temperatureC, 1);
    lcd.print("C");

    // Debug Logs
/*
    Serial.printf("Humidity: %.1f%%, Temperature: %.1fC\n", humidity, temperatureC);
    Serial.printf("LPG: %dppm, CO: %dppm, SMOKE: %dppm\n", lpg, co, smoke);
*/
  }
}

