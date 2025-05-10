document.getElementById('image-upload').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const imageUrl = e.target.result;
            document.getElementById('uploaded-image').src = imageUrl;
            document.getElementById('image-preview-container').style.display = 'block';

            // Extract EXIF data
            EXIF.getData(file, function () {
                const exif = EXIF.getAllTags(this);
                displayExifData(exif, file.name);
                generateThumbnail(imageUrl);
            });
        }

        reader.readAsDataURL(file);
    } else {
        document.getElementById('image-preview-container').style.display = 'none';
        document.getElementById('exif-data').style.display = 'none';
        document.getElementById('thumbnail-preview-container').style.display = 'none';
    }
});

function displayExifData(exif, filename) {
    document.getElementById('exif-data').style.display = 'block';

    document.getElementById('camera').value = exif['Make'] ? `${exif['Make']} ${exif['Model'] || ''}` : '';
    document.getElementById('lens').value = exif['LensMake'] ? `${exif['LensMake']} ${exif['LensModel'] || ''}` : '';

    const aperture = exif['FNumber'] ? `ƒ/${eval(exif['FNumber'])}` : '';
    document.getElementById('aperture').value = aperture;

    let shutterSpeed = '';
    if (exif['ExposureTime']) {
        const exposureTime = parseFloat(exif['ExposureTime']);
        if (exposureTime < 1 && exposureTime > 0) {
            // Convert to fraction if less than 1 second
            const tolerance = 0.001; // Adjust for precision
            let numerator = 1;
            let denominator = 1 / exposureTime;
            while (Math.abs(denominator - Math.round(denominator)) > tolerance && denominator < 1000) {
                numerator++;
                denominator = 1 / (exposureTime / numerator);
            }
            shutterSpeed = `1/${Math.round(denominator)}`;
        } else {
            shutterSpeed = `${exposureTime} s`;
        }
    }
    document.getElementById('shutter').value = shutterSpeed;

    document.getElementById('iso').value = exif['ISOSpeedRatings'] || '';
    document.getElementById('imagePath').value = `images/${filename}`;
}

function generateThumbnail(imageUrl) {
    const canvas = document.getElementById('thumbnail-canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = function () {
        const size = Math.min(this.width, this.height);
        const x = (this.width - size) / 2;
        const y = (this.height - size) / 2;

        canvas.width = 256;
        canvas.height = 256;
        ctx.drawImage(img, x, y, size, size, 0, 0, 256, 256);

        // Get the data URL as JPEG with a quality of 0.8 (adjust as needed)
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);

        // For demonstration, let's display the JPEG thumbnail in a new image tag
        const thumbnailImage = document.createElement('img');
        thumbnailImage.src = thumbnailUrl;
        thumbnailImage.classList.add('thumbnail');

        // Replace the canvas with the image tag (you might want to handle this differently)
        const thumbnailContainer = document.getElementById('thumbnail-preview-container');
        thumbnailContainer.innerHTML = ''; // Clear the canvas
        thumbnailContainer.appendChild(thumbnailImage);
        thumbnailContainer.style.display = 'block';
    }

    img.src = imageUrl;
}