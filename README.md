<b>Micro:bit Remote Control Car Always Find the North Direction</b>

My aim is to build an autonomous remote control car that is able to run on the predefined tracks/coordinates  that I have marked from the Google Map.
But before I go into that,  let's start with a simple step:  To find the North direction.

In order to achieve this, I created the cordova app on Android phone and created a function to scan &  find the North direction and communicate back to micro:bit to control the wheels. You can take a look at function onCompassUpdate.

On the micro:bit part, I created a C++ code to listen to the instructions from the cordova app to drive the motor, like turn to the left or right direction. Once the instruction sent by cordova app has been completely executed, it will send  the event value ‘91’ to tell cordova app, ‘hey, I am ready for your next instruction’. This is to ensure the instruction is executed one at a time.

I am using the smartphone (Samsung Galaxy S4)  compass instead of using the micro:bit compass as it gives me lots of headaches due to  inaccurate reading. 

Here is the full source code:
https://github.com/ferrygun/micro-bit-buggy-direction

Install .APK on your Andriod phone:
https://github.com/ferrygun/micro-bit-buggy-direction/blob/master/android-debug.apk

Install .Hex on your micro:bit:
https://github.com/ferrygun/micro-bit-buggy-direction/blob/master/microbit-samples-combined.hex

Platform:
Samsung Android Galaxy S4
