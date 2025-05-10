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
                displayExifData(exif);
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

function displayExifData(exif) {
    const exifOutput = document.getElementById('exif-output');
    let output = '';
    if (exif['Make']) output += `Camera: ${exif['Make']} ${exif['Model'] || ''}\n`;
    if (exif['LensMake']) output += `Lens: ${exif['LensMake']} ${exif['LensModel'] || ''}\n`;
    if (exif['FNumber']) output += `Aperture: f/${eval(exif['FNumber'])}\n`;
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
            output += `Shutter Speed: 1/${Math.round(denominator)}\n`;
        } else {
            output += `Shutter Speed: ${exposureTime} s\n`;
        }
    }
    if (exif['ISOSpeedRatings']) output += `ISO: ${exif['ISOSpeedRatings']}\n`;

    if (output) {
        exifOutput.textContent = output;
        document.getElementById('exif-data').style.display = 'block';
    } else {
        exifOutput.textContent = 'No relevant EXIF data found.';
        document.getElementById('exif-data').style.display = 'block';
    }
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