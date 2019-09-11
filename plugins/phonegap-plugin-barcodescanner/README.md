# PhoneGap Plugin BarcodeScanner, now with ACTUAL browser support
================================

[![Build Status](https://travis-ci.org/phonegap/phonegap-plugin-barcodescanner.svg)](https://travis-ci.org/phonegap/phonegap-plugin-barcodescanner)

Cross-platform BarcodeScanner for Cordova / PhoneGap.

Follows the [Cordova Plugin spec](https://cordova.apache.org/docs/en/latest/plugin_ref/spec.html), so that it works with [Plugman](https://github.com/apache/cordova-plugman).

UPDATE: THIS IS THE FIRST WORKING VERSION OF THE BROWSER SUPPORT. PLEASE SEE _Browser usage_ FOR MORE DETAILS.

It only supports QR, ITF, and Code128 and only detects a barcode when you fill the entire width of the screen with the barcode. But it works, and it's better than nothing.
Please note any issues or improvements you find on github!


## Installation

This requires phonegap 7.1.0+ ( current stable v8.0.0 )

    phonegap plugin add cordova-plugin-barcodescanner-browser-support

It is also possible to install via repo url directly ( unstable )

    phonegap plugin add https://github.com/Tjieco/phonegap-plugin-barcodescanner-browser-support

Optional variables:
This plugin requires the Android support library v4. The minimum version is `24.1.0`. Default value is `27.+`.  Check out the latest version [here](https://developer.android.com/topic/libraries/support-library/revisions.html).
```
phonegap plugin add cordova-plugin-barcodescanner-browser-support --variable ANDROID_SUPPORT_V4_VERSION="27.1.1"
```
### Supported Platforms

- Android
- iOS
- Windows (Windows/Windows Phone 8.1 and Windows 10)
- Browser

Note: the Android source for this project includes an Android Library Project.
plugman currently doesn't support Library Project refs, so its been
prebuilt as a jar library. Any updates to the Library Project should be
committed with an updated jar.

Note: Windows 10 applications can not be build for `AnyCPU` architecture, which is default for Windows platform. If you want to build/run Windows 10 app, you should specify target architecture explicitly, for example (Cordova CLI):

```
cordova run windows -- --archs=x86
```

### PhoneGap Build Usage

Add the following to your config.xml:

```
<!-- add a version here, otherwise PGB will use whatever the latest version of the package on npm is -->
<plugin name="phonegap-plugin-barcodescanner" />
```
On PhoneGap Build if you're using a version of cordova-android of 4 or less, ensure you're building with gradle:
```
<preference name="android-build-tool" value="gradle" />
```

## Using the plugin ##
The plugin creates the object `cordova.plugins.barcodeScanner` with the method `scan(success, fail)`.

The following barcode types are currently supported:

|  Barcode Type | Android | iOS | Windows  | Browser |
|---------------|:-------:|:---:|:--------:|:-------:|
| QR_CODE       |    ✔    |  ✔  |     ✔    |   ✔   |
| DATA_MATRIX   |    ✔    |  ✔  |     ✔    |   ✖   |
| UPC_A         |    ✔    |  ✔  |     ✔    |   ✖   |
| UPC_E         |    ✔    |  ✔  |     ✔    |   ✖   |
| EAN_8         |    ✔    |  ✔  |     ✔    |   ✖   |
| EAN_13        |    ✔    |  ✔  |     ✔    |   ✖   |
| CODE_39       |    ✔    |  ✔  |     ✔    |   ✖   |
| CODE_93       |    ✔    |  ✖  |     ✔    |   ✖   |
| CODE_128      |    ✔    |  ✔  |     ✔    |   ✔   |
| CODABAR       |    ✔    |  ✖  |     ✔    |   ✖   |
| ITF           |    ✔    |  ✔  |     ✔    |   ✔   |
| RSS14         |    ✔    |  ✖  |     ✔    |   ✖   |
| PDF417        |    ✔    |  ✖  |     ✔    |   ✖   |
| RSS_EXPANDED  |    ✔    |  ✖  |     ✖    |   ✖   |
| MSI           |    ✖    |  ✖  |     ✔    |   ✖   |
| AZTEC         |    ✖    |  ✖  |     ✔    |   ✖   |

More browser barcode support will be added with future updates of available ports.

`success` and `fail` are callback functions. Success is passed an object with data, type and cancelled properties. Data is the text representation of the barcode data, type is the type of barcode detected and cancelled is whether or not the user cancelled the scan.

A full example could be:
```js
   cordova.plugins.barcodeScanner.scan(
      function (result) {
          alert("We got a barcode\n" +
                "Result: " + result.text + "\n" +
                "Format: " + result.format + "\n" +
                "Cancelled: " + result.cancelled);
      },
      function (error) {
          alert("Scanning failed: " + error);
      },
      {
          preferFrontCamera : true, // iOS and Android
          showFlipCameraButton : true, // iOS and Android
          showTorchButton : true, // iOS and Android
          torchOn: true, // Android, launch with the torch switched on (if available)
          saveHistory: true, // Android, save scan history (default false)
          prompt : "Place a barcode inside the scan area", // Android
          resultDisplayDuration: 500, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
          formats : "QR_CODE,PDF_417", // default: all but PDF_417 and RSS_EXPANDED
          orientation : "landscape", // Android only (portrait|landscape), default unset so it rotates with the device
          disableAnimations : true, // iOS
          disableSuccessBeep: false // iOS and Android
      }
   );
```

## Browser usage ##

This fork uses the browser functionalities to open the user media, allowing the camera to be used.
The javascript code to decode a barcode comes from: https://github.com/zxing-js/library

The "scan" functionality to enter the barcode manually still works. This ensures that existing applications do not break with the addition of this feature.
However, you can add a video element to your page. The plugin will look for a HTML element with the id "barcodeScanStream".
If the plugin detects the element, it will open the user media and place the camera stream inside the video element.

The default camera will be the back camera. This can be changed using an html element with the id "barcodeScanDevice".
Defaultly taking the back camera, or the remaining camera if that does not exist.

```
An example could be:

        <div class="video">
            <video id="barcodeScanStream"></video>
        </div>

        <div class="inputControls">
            <div id="deviceready">
                <button onclick="scan()" id="scanButton">Scan barcode</button>
                <!-- 0 is the front camera, 1 is the back camera -->
                <input type="text" id="barcodeScanDevice" placeholder="1">
            </div>
        </div>
```


## Encoding a Barcode ##

The plugin creates the object `cordova.plugins.barcodeScanner` with the method `encode(type, data, success, fail)`.

Supported encoding types:

* TEXT_TYPE
* EMAIL_TYPE
* PHONE_TYPE
* SMS_TYPE

```
A full example could be:

   cordova.plugins.barcodeScanner.encode(cordova.plugins.barcodeScanner.Encode.TEXT_TYPE, "http://www.nytimes.com", function(success) {
            alert("encode success: " + success);
          }, function(fail) {
            alert("encoding failed: " + fail);
          }
        );
```

## Browser quirks ##

Currently, a barcode only gets detected when it takes up almost the entire horizontal space.
There's also an issue where the camera does not focus properly. It takes a while for it to adjust.
Since node modules with cordova browser works differently than cordova plugins, I could not manage to create a node dependency. The code to scan a barcode is thus minified and copied into the plugin. Unfortunately, I could not forsee a better solution.

## iOS quirks ##

Since iOS 10 it's mandatory to add a `NSCameraUsageDescription` in the `Info.plist`.

`NSCameraUsageDescription` describes the reason that the app accesses the user's camera.
When the system prompts the user to allow access, this string is displayed as part of the dialog box. If you didn't provide the usage description, the app will crash before showing the dialog. Also, Apple will reject apps that access private data but don't provide an usage description.

To add this entry you can use the `edit-config` tag in the `config.xml` like this:

```
<edit-config target="NSCameraUsageDescription" file="*-Info.plist" mode="merge">
    <string>To scan barcodes</string>
</edit-config>
```

## Windows quirks ##

* Windows implementation currently doesn't support encode functionality.

* On Windows 10 desktop ensure that you have Windows Media Player and Media Feature pack installed.

## Thanks on Github ##

So many -- check out the original [iOS](https://github.com/phonegap/phonegap-plugins/tree/DEPRECATED/iOS/BarcodeScanner),  [Android](https://github.com/phonegap/phonegap-plugins/tree/DEPRECATED/Android/BarcodeScanner) and
[BlackBerry 10](https://github.com/blackberry/WebWorks-Community-APIs/tree/master/BB10-Cordova/BarcodeScanner) repos.

## Licence ##

The MIT License

Copyright (c) 2010 Matt Kane

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
