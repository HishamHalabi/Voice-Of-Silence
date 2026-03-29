const int numSensors = 2;

void setup() {
  Serial.begin(9600);
}

void loop() {
  // Read and send raw analog values
  for(int i=0; i<numSensors; i++) {
    int val = analogRead(i);
    Serial.print(val);
    if(i < numSensors - 1) Serial.print(","); 
  }
  
  Serial.println(); 
  delay(50); 
}