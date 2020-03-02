const getPixels = require('get-pixels');
const quantize = require('quantize');

function createPixelArray(imgData, pixelCount, quality) {
    const pixels = imgData;
    const pixelArray = [];

    for (let i = 0, offset, r, g, b, a; i < pixelCount; i = i + quality) {
        offset = i * 4;
        r = pixels[offset + 0];
        g = pixels[offset + 1];
        b = pixels[offset + 2];
        a = pixels[offset + 3];

        // If pixel is mostly opaque and not white
        if (typeof a === 'undefined' || a >= 125) {
            if (!(r > 220 && g > 220 && b > 220)) {
                pixelArray.push([r, g, b]);
            }
        }
    }
    return pixelArray;
}

function validateOptions(options) {
    let { colorCount, quality } = options;

    if (typeof colorCount === 'undefined' || !Number.isInteger(colorCount)) {
        colorCount = 10;
    } else if (colorCount === 1 ) {
        throw new Error('colorCount should be between 2 and 20. To get one color, call getColor() instead of getPalette()');
    } else {
        colorCount = Math.max(colorCount, 2);
        colorCount = Math.min(colorCount, 20);
    }

    if (typeof quality === 'undefined' || Number.isInteger(quality)) {
        quality = 10;
    } else if (quality < 1) {
        quality = 10;
    }

    return {
        colorCount,
        quality
    }
}

function loadImg(img) {
    return new Promise((resolve, reject) => {
        getPixels(img, function(err, data) {
            if(err) {
                reject(err)
            } else {
                resolve(data);
            }
        })
    });
}

function getColor(img, quality) {
    return new Promise((resolve, reject) => {
        getPalette(img, 5, quality)
            .then(palette => {
                resolve(palette[0]);
            })
            .catch(err => {
                reject(err);
            })
    });

}

function createSortedPalette (pixelArray) {
  // array of objects of form 
  // {
  //   count: number,
  //   rgb: [r, g, b] 
  // }
  let palette = []
  pixelArray.forEach(px => {
    let paletteEntry = palette.find(pe => JSON.stringify(pe.rgb) === JSON.stringify(px))
    if (!paletteEntry) {
      paletteEntry = {
        count: 0,
        rgb: px
      }
      palette.push(paletteEntry)
    }
    paletteEntry.count++
  })
  return palette.sort((a, b) => b.count - a.count)
    .map(pe => pe.rgb)
}

function getPalette(img, colorCount = 10, quality = 10) {
    const options = validateOptions({
        colorCount,
        quality
    });

    return new Promise((resolve, reject) => {
        loadImg(img)
            .then(imgData => {
                const pixelCount = imgData.shape[0] * imgData.shape[1];
                const pixelArray = createPixelArray(imgData.data, pixelCount, options.quality);

                // const cmap = quantize(pixelArray, options.colorCount);
                // const palette = cmap? cmap.palette() : null;

                const palette = createSortedPalette(pixelArray)

                resolve(palette);
            })
            .catch(err => {
                reject(err);
            })
    });
}

module.exports = {
    getColor,
    getPalette
};

