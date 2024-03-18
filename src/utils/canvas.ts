
const drawVerticalLine = function(context, left, top, height, color) {
  context.fillStyle = color;
  context.fillRect(left, top, 1, height);
};

let objectUrl;

export function showImage(canvas: HTMLCanvasElement, data: any, rollStatus?: number, lineX?: number, manualEyeSelection?: any) {
  const context: any = canvas && canvas.getContext('2d');

  if (!context) return;

  if (!data) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const imageObj = new Image();
  let imgSrc
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  if (data.type === 'Buffer') {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
    objectUrl = URL.createObjectURL(new Blob([new Uint8Array(data.data)], { type: 'image/jpeg' }));
    imgSrc = objectUrl
  } else {
    imgSrc = 'data:image/charset=UTF-8;png;base64,' + data;
  }

  const fitImageOn = function(imageObj) {
    const imageAspectRatio = imageObj.width / imageObj.height;
    const canvasAspectRatio = canvasWidth / canvasHeight;
    let renderableHeight, renderableWidth, xStart, yStart;

    if(imageAspectRatio < canvasAspectRatio) {
      renderableHeight = canvasHeight;
      renderableWidth = imageObj.width * (renderableHeight / imageObj.height);
      xStart = (canvasWidth - renderableWidth) / 2;
      yStart = 0;
    } else if(imageAspectRatio > canvasAspectRatio) {
      renderableWidth = canvasWidth
      renderableHeight = imageObj.height * (renderableWidth / imageObj.width);
      xStart = 0;
      yStart = (canvasHeight - renderableHeight) / 2;
    } else {
      renderableHeight = canvasHeight;
      renderableWidth = canvasWidth;
      xStart = 0;
      yStart = 0;
    }

    const img = context.createImageData(canvasWidth, canvasHeight);
    for (let i = img.data.length; --i >= 0;) {
      img.data[i] = 0;
    }
    context.putImageData(img, 0, 0);

    context.drawImage(imageObj, xStart, yStart, renderableWidth, renderableHeight);

    if (lineX && rollStatus) {
      drawVerticalLine(context, (460 / 800) * lineX, xStart - 60, renderableHeight, rollStatus > 1 ? "green" : "red");
    }

    if (rollStatus === 0) {
      drawVerticalLine(context, 0, 0, renderableHeight, "white");
    }

    if (manualEyeSelection && manualEyeSelection.eyes.length > 0) {
      context.save();
      manualEyeSelection.eyes.forEach((eye) => {
        context.strokeStyle = "red";
        context.beginPath();
        context.arc(eye.x, eye.y, 5, 0, 2 * Math.PI);
        context.stroke();
      });
      context.restore();
    }
  };

  imageObj.onload = function() {
    fitImageOn(imageObj);
  };
  imageObj.src = imgSrc;
}
