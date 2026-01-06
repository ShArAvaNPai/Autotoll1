import os
import zipfile
import glob
import random
import yaml
import shutil
import xml.etree.ElementTree as ET

def convert_box(size, box):
    dw = 1. / size[0]
    dh = 1. / size[1]
    x = (box[0] + box[1]) / 2.0
    y = (box[2] + box[3]) / 2.0
    w = box[1] - box[0]
    h = box[3] - box[2]
    return (x * dw, y * dh, w * dw, h * dh)

def convert_annotation(xml_file, output_path, classes):
    tree = ET.parse(xml_file)
    root = tree.getroot()
    size = root.find('size')
    w = int(size.find('width').text)
    h = int(size.find('height').text)

    # Some images might be 0, skip them
    if w == 0 or h == 0:
        return False

    out_file = open(output_path, 'w')
    
    for obj in root.iter('object'):
        cls = obj.find('name').text
        if cls not in classes:
            continue
        cls_id = classes.index(cls)
        xmlbox = obj.find('bndbox')
        b = (float(xmlbox.find('xmin').text), float(xmlbox.find('xmax').text), 
             float(xmlbox.find('ymin').text), float(xmlbox.find('ymax').text))
        bb = convert_box((w, h), b)
        out_file.write(str(cls_id) + " " + " ".join([str(a) for a in bb]) + '\n')
    
    out_file.close()
    return True

def prepare_kaggle_dataset(zip_path="archive.zip", dataset_dir="dataset_kaggle"):
    # 1. Unzip
    if os.path.exists(zip_path):
        print(f"Unzipping {zip_path}...")
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall("temp_extract")
    else:
        # Check if already extracted manually
        if not os.path.exists("temp_extract"):
            print(f"Error: {zip_path} not found and 'temp_extract' folder missing.")
            return

    # 2. Setup Directories
    if os.path.exists(dataset_dir):
        shutil.rmtree(dataset_dir)
    
    for split in ['train', 'val']:
        os.makedirs(os.path.join(dataset_dir, 'images', split), exist_ok=True)
        os.makedirs(os.path.join(dataset_dir, 'labels', split), exist_ok=True)

    # 3. Find files (The dataset structure varies, usually images and annotations folders)
    # We'll search recursively
    print("Scanning files...")
    all_images = glob.glob("temp_extract/**/*.png", recursive=True) + \
                 glob.glob("temp_extract/**/*.jpg", recursive=True) + \
                 glob.glob("temp_extract/**/*.jpeg", recursive=True)
    
    # Filter 
    data_pairs = []
    classes = ['number_plate'] # Based on typical Kaggle plate datasets

    for img_path in all_images:
        # Correspondng XML
        base_path = os.path.splitext(img_path)[0]
        xml_path = base_path + ".xml" 
        
        # Sometimes xml is in a separate folder 'annotations', handling that is tricky without structure knowledge
        # Let's try simple replacement first. If not found, try searching.
        if not os.path.exists(xml_path):
            # Fallback: search for xml with same basename
            basename = os.path.basename(base_path)
            potential_xmls = glob.glob(f"temp_extract/**/{basename}.xml", recursive=True)
            if potential_xmls:
                xml_path = potential_xmls[0]
            else:
                continue # No annotation
        
        data_pairs.append((img_path, xml_path))

    print(f"Found {len(data_pairs)} labeled images.")
    random.shuffle(data_pairs)
    
    # 4. Split and Convert
    split_idx = int(len(data_pairs) * 0.8)
    train_set = data_pairs[:split_idx]
    val_set = data_pairs[split_idx:]
    
    for split_name, dataset in [('train', train_set), ('val', val_set)]:
        print(f"Processing {split_name}...")
        for img_path, xml_path in dataset:
            filename = os.path.basename(img_path)
            txt_filename = os.path.splitext(filename)[0] + ".txt"
            
            # Destination paths
            dest_img = os.path.join(dataset_dir, 'images', split_name, filename)
            dest_label = os.path.join(dataset_dir, 'labels', split_name, txt_filename)
            
            # Convert
            if convert_annotation(xml_path, dest_label, classes):
                shutil.copy(img_path, dest_img)
            else:
                os.remove(dest_label) # Empty or corrupt

    # 5. Create YAML
    data_yaml = {
        'path': os.path.abspath(dataset_dir),
        'train': 'images/train',
        'val': 'images/val',
        'names': {i: name for i, name in enumerate(classes)}
    }
    
    with open('kaggle_data.yaml', 'w') as f:
        yaml.dump(data_yaml, f)

    print("Cleanup...")
    shutil.rmtree("temp_extract")
    print("Done! Ready to train.")
    print(f"Run: python3 train.py --data kaggle_data.yaml")

if __name__ == "__main__":
    prepare_kaggle_dataset()
