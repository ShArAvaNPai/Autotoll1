import cv2
import numpy as np
import random
import os
import string
from PIL import Image, ImageDraw, ImageFont

def random_plate_number():
    """Generates a random Indian license plate number."""
    states = ["MH", "DL", "KA", "TN", "UP", "GJ", "WB", "TS", "RJ", "KL"]
    state = random.choice(states)
    district = f"{random.randint(1, 99):02d}"
    series = "".join(random.choices(string.ascii_uppercase, k=random.randint(1, 2)))
    number = f"{random.randint(1, 9999):04d}"
    
    # 50% chance of spaces, 50% chance of no spaces
    if random.random() > 0.5:
        return f"{state}{district}{series}{number}", False # Standard
    else:
        return f"{state} {district} {series} {number}", True # Spaced

def generate_plate_image(text, output_path, label_path):
    """Generates an image of a license plate and saves it with YOLO label."""
    
    # Text Config
    width, height = 400, 100
    bg_color = (255, 255, 255) # White background mainly
    if random.random() > 0.8: bg_color = (255, 255, 0) # 20% Yellow plates
    
    image = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(image)
    
    # Font
    # Try to load a font, fallback to default (which is tiny, but workable for simulated low res)
    # Ideally checking for common linux fonts
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf"
    ]
    
    font = None
    for p in font_paths:
        if os.path.exists(p):
            try:
                # Calculate likely font size to fit height
                font_size = 70
                font = ImageFont.truetype(p, font_size)
                break
            except:
                continue
                
    if font is None:
        font = ImageFont.load_default() # Fallback

    # Draw Text Centered
    # Using textbbox if available (Pillow >= 9.2.0), else basic centering logic
    text_w, text_h = 0, 0
    try:
        # basic approximation if textbbox fails or old pillow
        if hasattr(draw, 'textbbox'):
             l, t, r, b = draw.textbbox((0, 0), text, font=font)
             text_w, text_h = r - l, b - t
        else:
             text_w, text_h = draw.textsize(text, font=font)
    except:
         pass

    x = (width - text_w) / 2
    y = (height - text_h) / 2
    
    # Add random offset
    x += random.randint(-10, 10)
    y += random.randint(-5, 5)

    text_color = (0, 0, 0)
    draw.text((x, y), text, font=font, fill=text_color)
    
    # PIL to OpenCV
    img_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

    # 1. Add Noise
    noise = np.random.normal(0, 10, img_cv.shape).astype(np.uint8)
    img_cv = cv2.add(img_cv, noise)

    # 2. Add Blur (Motion or Gaussian)
    if random.random() > 0.5:
        k = random.choice([3, 5])
        img_cv = cv2.GaussianBlur(img_cv, (k, k), 0)
        
    # 3. Random Perspective / Rotation (Simulate camera angle)
    # Simple affine rotation for now
    angle = random.randint(-5, 5)
    M = cv2.getRotationMatrix2D((width/2, height/2), angle, 1)
    img_cv = cv2.warpAffine(img_cv, M, (width, height), borderValue=bg_color)
    
    # 4. Save
    cv2.imwrite(output_path, img_cv)
    
    # 5. Generate YOLO Label
    # Since we are generating just the plate, the class is 'license_plate' (id 0)
    # And it covers roughly the whole image, but we should try to be precise if we had bounding box of text
    # For now, let's assume the PLATE is the object, so the whole image is the object (since we cropped it)
    # BUT wait, YOLO training usually expects "Object inside Image".
    # If we train a detector, we need background.
    # So we should paste this plate onto a random background image?
    # OR we are training a detector that runs ON CROPS.
    # If we run on crops, the input IS the plate (mostly).
    # Actually, "Specialized Plate Detector" usually means: Input = Car Crop, Output = Plate Box.
    # So we need images of CARS with PLATES.
    # Generating purely plates is good for OCR, but for DETECTOR (YOLO), we need "Plate inside context".
    
    # APPROACH REVISION:
    # To train a robust "Plate Detector", we need the plate to be a SUBSET of the image.
    # Let's create a larger canvas (representing a car bumper) and paste the plate in the middle.
    
    bumper_w, bumper_h = width + 200, height + 200
    bumper_color = (random.randint(50, 200), random.randint(50, 200), random.randint(50, 200))
    bumper_img = np.full((bumper_h, bumper_w, 3), bumper_color, dtype=np.uint8)
    
    # Paste plate onto bumper
    y_offset = (bumper_h - height) // 2 + random.randint(-20, 20)
    x_offset = (bumper_w - width) // 2 + random.randint(-20, 20)
    
    # Ensure ROI
    y1, y2 = y_offset, y_offset + height
    x1, x2 = x_offset, x_offset + width
    
    bumper_img[y1:y2, x1:x2] = img_cv
    
    # Final Output
    cv2.imwrite(output_path, bumper_img)
    
    # Normalize Coordinates for YOLO
    # Class x_center y_center width height (0-1 relative)
    ucx = (x1 + width/2) / bumper_w
    ucy = (y1 + height/2) / bumper_h
    uw = width / bumper_w
    uh = height / bumper_h
    
    with open(label_path, 'w') as f:
        f.write(f"0 {ucx:.6f} {ucy:.6f} {uw:.6f} {uh:.6f}\n")

def generate_dataset(num_train=100, num_val=20):
    base_dir = "datasets/synthetic_plates"
    dirs = ['train/images', 'train/labels', 'val/images', 'val/labels']
    
    for d in dirs:
        os.makedirs(os.path.join(base_dir, d), exist_ok=True)
        
    print(f"Generating {num_train} training samples...")
    for i in range(num_train):
        text, _ = random_plate_number()
        generate_plate_image(
            text, 
            f"{base_dir}/train/images/{i}.jpg", 
            f"{base_dir}/train/labels/{i}.txt"
        )
        
    print(f"Generating {num_val} validation samples...")
    for i in range(num_val):
        text, _ = random_plate_number()
        generate_plate_image(
            text, 
            f"{base_dir}/val/images/{i}.jpg", 
            f"{base_dir}/val/labels/{i}.txt"
        )

    # Create data.yaml
    yaml_content = f"""path: {os.path.abspath(base_dir)}
train: train/images
val: val/images

names:
  0: license_plate
"""
    with open("data.yaml", "w") as f:
        f.write(yaml_content)
        
    print("Dataset Generation Complete. Created data.yaml")

if __name__ == '__main__':
    generate_dataset()
