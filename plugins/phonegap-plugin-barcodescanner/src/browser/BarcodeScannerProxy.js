function startScan(deviceId, videoOutputElementId, success, error) {
    var library = cordova.require("phonegap-plugin-barcodescanner.Library");
    var codeReader = new library.BrowserBarcodeReader();
    codeReader.getVideoInputDevices().then((videoInputDevices) => {
        if (videoInputDevices.length === 0) {
            console.log("no video input devices found");
            promptBarcode(success, error);
        }
        else {
            if (!videoInputDevices[deviceId]) {
                //Defaulting to 0 if device not found
                deviceId = 0;
            }
            codeReader.decodeFromInputVideoDevice(videoInputDevices[deviceId].deviceId, videoOutputElementId).then(function (res) {
                var result = {
                    text: res.getText(),
                    format: res.getBarcodeFormat(),
                    cancelled: false
                };
                stream.getTracks()[0].stop();
                success(result);
            }).catch(function (err) {
                error(err);
            });
            console.log('Started continous decode from camera with id ' + deviceId);

            if (document.getElementById('resetButton')) {
                document.getElementById('resetButton').addEventListener('click', () => {
                    codeReader.reset();
                })
            }
        }
    }).catch((err) => {
        error(err);
    });
}

function scan(success, error) {
    var videoElement = document.getElementById("barcodeScanStream");
    if(videoElement){
        deviceId = document.getElementById("barcodeScanDevice");
        if (deviceId) {
            startScan(deviceId, videoElement, success, error);
        }
        else {
            startScan(1, videoElement, success, error);
        }
    }
    else {
        promptBarcode(success, error);
    }
}

function promptBarcode(success, error) {
    var code = window.prompt("Enter barcode value (empty value will fire the error handler):");
    if (code) {
        var result = {
            text: code,
            format: "Fake",
            cancelled: false
        };
        success(result);
    } else {
        error("No barcode");
    }
}
function encode(type, data, success, errorCallback) {
    success();
}

module.exports = {
    scan: scan,
    encode: encode
};
require("cordova/exec/proxy").add("BarcodeScanner",module.exports);
