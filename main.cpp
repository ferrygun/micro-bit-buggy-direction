#include "MicroBit.h"
MicroBit uBit;

#define EVENT_ID		 8888
#define DC_BUTTON_LEFT   1001
#define DC_BUTTON_RIGHT  1002
#define DC_STOP			 1003


void onConnected(MicroBitEvent) {
  //uBit.display.print("C");
}

 
void onDisconnected(MicroBitEvent){
  // uBit.display.print("D");
}

void onControllerEvent(MicroBitEvent e) {
	//"Right" direction
	if (e.value == DC_BUTTON_RIGHT)  {
		uBit.io.P8.setDigitalValue(0);
		uBit.io.P12.setDigitalValue(1);

		uBit.io.P0.setDigitalValue(1);
		uBit.io.P16.setAnalogValue(600); 
		uBit.sleep(500);

		uBit.io.P8.setDigitalValue(1);
		uBit.io.P12.setDigitalValue(0);

		uBit.io.P16.setDigitalValue(1);
		uBit.io.P0.setAnalogValue(600);
		uBit.sleep(500);

		uBit.io.P8.setDigitalValue(0);
		uBit.io.P12.setDigitalValue(0);

		uBit.io.P16.setDigitalValue(0);
		uBit.io.P0.setDigitalValue(0);

		uBit.sleep(2000);
		MicroBitEvent evt(EVENT_ID, 91);
	}

	//"Left" direction
	if (e.value == DC_BUTTON_LEFT)  { 
		uBit.io.P8.setDigitalValue(1);
		uBit.io.P12.setDigitalValue(0);

		uBit.io.P0.setDigitalValue(1);
		uBit.io.P16.setAnalogValue(600);
		uBit.sleep(500);

			
		uBit.io.P8.setDigitalValue(0);
		uBit.io.P12.setDigitalValue(1);

		uBit.io.P16.setDigitalValue(1);
		uBit.io.P0.setAnalogValue(600);
		uBit.sleep(500);

		uBit.io.P8.setDigitalValue(0);
		uBit.io.P12.setDigitalValue(0);

		uBit.io.P16.setDigitalValue(0);
		uBit.io.P0.setDigitalValue(0);

		uBit.sleep(2000);
		MicroBitEvent evt(EVENT_ID, 91);
	}

	//Stop
	if (e.value == DC_STOP)  {
		uBit.io.P8.setDigitalValue(0);
		uBit.io.P12.setDigitalValue(0);

		uBit.io.P16.setDigitalValue(0);
		uBit.io.P0.setDigitalValue(0);
	}

}



void onButton(MicroBitEvent e) {
	if (e.source == MICROBIT_ID_BUTTON_A) {
		//uBit.display.scroll("BTN A UP");
		MicroBitEvent evt(EVENT_ID, 1);
    }

	if (e.source == MICROBIT_ID_BUTTON_B) {
		//uBit.display.scroll("BTN B UP");
		MicroBitEvent evt(EVENT_ID, 2);
    }
}


int main() {
    uBit.init();
	uBit.display.scroll("DC");
	new MicroBitAccelerometerService(*uBit.ble, uBit.accelerometer);
	uBit.messageBus.listen(MICROBIT_ID_BLE, MICROBIT_BLE_EVT_CONNECTED, onConnected);
	uBit.messageBus.listen(MICROBIT_ID_BLE, MICROBIT_BLE_EVT_DISCONNECTED, onDisconnected);
	uBit.messageBus.listen(EVENT_ID, 0, onControllerEvent);

	uBit.messageBus.listen(MICROBIT_ID_BUTTON_A, MICROBIT_BUTTON_EVT_CLICK, onButton);

	release_fiber();
}