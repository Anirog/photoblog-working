from flask import Flask, request, jsonify, render_template
import os
import json
import shutil  # Import the shutil module
from datetime import datetime

app = Flask(__name__)  # Remove template_folder='.'
UPLOAD_FOLDER = 'static/images/uploads'  # Update this line
JSON_FILE = 'photos.json'
DEPLOY_DIR = 'deploy'  # Rename the output directory

app.config['ENV'] = 'development'  # Set the environment to development
app.debug = True  # Disable debug mode for production

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DEPLOY_DIR, exist_ok=True)  # Ensure the deploy directory exists

# Add a custom test to Jinja2 environment
app.jinja_env.tests['datetime'] = lambda obj: isinstance(obj, datetime)

def generate_static_site():
    """Generates static HTML files for each photo."""
    photos = []
    if os.path.exists(JSON_FILE):
        with open(JSON_FILE, 'r') as f:
            try:
                photos = json.load(f)
            except json.JSONDecodeError:
                print("Error decoding JSON from photos.json")
                return

    # Convert date strings to datetime objects
    for photo in photos:
        try:
            photo['date'] = datetime.strptime(photo['date'], '%Y-%m-%d')
        except ValueError:
            print(f"Invalid date format in photos.json: {photo['date']}")
            photo['date'] = None  # Or handle the error as needed

    # Clear the deploy/static/images folder
    deploy_image_dir = os.path.join(DEPLOY_DIR, 'static', 'images')
    if os.path.exists(deploy_image_dir):
        shutil.rmtree(deploy_image_dir)
        print(f"Cleared '{deploy_image_dir}'")
    os.makedirs(deploy_image_dir, exist_ok=True)  # Recreate the directory

    # Copy the profile image
    profile_image_src = os.path.join('static', 'images/site', 'larrie-knights.jpg')
    profile_image_dest = os.path.join(DEPLOY_DIR, 'static', 'images', 'site', 'larrie-knights.jpg')
    os.makedirs(os.path.dirname(profile_image_dest), exist_ok=True)  # Ensure the directory exists
    if os.path.exists(profile_image_src):
        shutil.copy(profile_image_src, profile_image_dest)
        print(f"Copied '{profile_image_src}' to '{profile_image_dest}'")
    else:
        print(f"Warning: Profile image '{profile_image_src}' not found.")

    # Copy only the required images
    for photo in photos:
        image_path = photo['imagePath']
        source_path = os.path.join('static', image_path)
        dest_path = os.path.join(DEPLOY_DIR, 'static', image_path)
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)  # Ensure the directory exists
        if os.path.exists(source_path):
            shutil.copy(source_path, dest_path)
            print(f"Copied '{source_path}' to '{dest_path}'")
        else:
            print(f"Warning: Image '{source_path}' not found.")

    # Copy the CSS file
    css_src = os.path.join('static', 'css', 'styles.css')
    css_dest = os.path.join(DEPLOY_DIR, 'static', 'css', 'styles.css')
    os.makedirs(os.path.dirname(css_dest), exist_ok=True)
    if os.path.exists(css_src):
        shutil.copy(css_src, css_dest)
        print(f"Copied '{css_src}' to '{css_dest}'")
    else:
        print(f"Warning: CSS file '{css_src}' not found.")

    # Generate index.html (latest photo)
    if photos:
        current_index = len(photos) - 1
    else:
        current_index = None
    index_html = render_template('index.html', photos=photos, current_index=current_index, generate_static=True)
    with open(os.path.join(DEPLOY_DIR, 'index.html'), 'w') as f:
        f.write(index_html)
    print(f"Generated index.html")

    # Generate individual photo pages (photo0.html, photo1.html, etc.)
    for i, photo in enumerate(photos):
        photo_html = render_template('index.html', photos=photos, current_index=i, generate_static=True)
        with open(os.path.join(DEPLOY_DIR, f'photo{i}.html'), 'w') as f:
            f.write(photo_html)
        print(f"Generated photo{i}.html")

    print("Static site generation complete!")

@app.route('/')
def index():
    photos = []
    if os.path.exists(JSON_FILE):
        with open(JSON_FILE, 'r') as f:
            try:
                photos = json.load(f)
            except json.JSONDecodeError:
                photos = []

    # Convert date strings to datetime objects
    for photo in photos:
        try:
            photo['date'] = datetime.strptime(photo['date'], '%Y-%m-%d')
        except ValueError:
            print(f"Invalid date format in photos.json: {photo['date']}")
            photo['date'] = None  # Or handle the error as needed

    if photos:
        current_index = len(photos) - 1
    else:
        current_index = None
    return render_template('index.html', photos=photos, current_index=current_index)

@app.route('/admin/upload')
def admin_upload_form():
    return render_template('upload.html')  # Serve the upload form

@app.route('/upload', methods=['POST'])
def upload_file():
    file = request.files.get('image')
    if not file:
        return jsonify({'error': 'No image uploaded'}), 400

    filename = file.filename
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    photo = {
        'imagePath': f'images/uploads/{filename}',
        'title': request.form.get('title', ''),
        'date': request.form.get('date', datetime.now().strftime('%Y-%m-%d')),
        'aperture': request.form.get('aperture', ''),
        'camera': request.form.get('camera', ''),
        'shutter': request.form.get('shutter', ''),
        'iso': request.form.get('iso', '')
    }

    photos_list = []
    if os.path.exists(JSON_FILE):
        with open(JSON_FILE, 'r') as f:
            try:
                photos_list = json.load(f)
            except json.JSONDecodeError:
                pass

    photos_list.append(photo)

    with open(JSON_FILE, 'w') as f:
        json.dump(photos_list, f, indent=2)

    return jsonify({'message': 'Upload successful'}), 200

@app.route('/photo/<int:index>')
def show_photo(index):
    photos = []
    if os.path.exists(JSON_FILE):
        with open(JSON_FILE, 'r') as f:
            try:
                photos = json.load(f)
            except json.JSONDecodeError:
                photos = []

    # Convert date strings to datetime objects
    for photo in photos:
        try:
            photo['date'] = datetime.strptime(photo['date'], '%Y-%m-%d')
        except ValueError:
            print(f"Invalid date format in photos.json: {photo['date']}")
            photo['date'] = None  # Or handle the error as needed

    if 0 <= index < len(photos):
        return render_template('index.html', photos=photos, current_index=index)
    else:
        return "Photo not found", 404

@app.route('/generate_static')
def generate_static():
    generate_static_site()
    return "Static site generated. Check the 'deploy' directory."

if __name__ == '__main__':
    app.run(debug=True)