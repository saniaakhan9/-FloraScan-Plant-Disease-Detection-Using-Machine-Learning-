"""
Script to create a limited dataset for more challenging training.
This will copy only a subset of images to make the task harder.
"""

import os
import shutil
import random

# Configuration
SOURCE_TRAIN = r'd:\Florascann\dataset\train'
SOURCE_TEST = r'd:\Florascann\dataset\test'
DEST_TRAIN = r'd:\Florascann\dataset_limited\train'
DEST_TEST = r'd:\Florascann\dataset_limited\test'

# Limit images per class (reduce this for harder task)
IMAGES_PER_CLASS_TRAIN = 150  # Only 150 images per class for training
IMAGES_PER_CLASS_TEST = 50    # 50 images per class for testing

def create_limited_dataset():
    print("Creating limited dataset...")
    print(f"Training images per class: {IMAGES_PER_CLASS_TRAIN}")
    print(f"Test images per class: {IMAGES_PER_CLASS_TEST}")
    print("=" * 50)
    
    # Create destination directories
    os.makedirs(DEST_TRAIN, exist_ok=True)
    os.makedirs(DEST_TEST, exist_ok=True)
    
    # Get class names
    class_names = sorted(os.listdir(SOURCE_TRAIN))
    print(f"Found {len(class_names)} classes")
    
    # Process training data
    print("\nProcessing training data...")
    total_train = 0
    for class_name in class_names:
        src_path = os.path.join(SOURCE_TRAIN, class_name)
        dst_path = os.path.join(DEST_TRAIN, class_name)
        os.makedirs(dst_path, exist_ok=True)
        
        # Get all images and randomly select subset
        images = os.listdir(src_path)
        selected = random.sample(images, min(IMAGES_PER_CLASS_TRAIN, len(images)))
        
        for img in selected:
            shutil.copy2(os.path.join(src_path, img), os.path.join(dst_path, img))
        
        total_train += len(selected)
        print(f"  {class_name}: {len(selected)} images")
    
    # Process test data
    print("\nProcessing test data...")
    total_test = 0
    for class_name in class_names:
        src_path = os.path.join(SOURCE_TEST, class_name)
        dst_path = os.path.join(DEST_TEST, class_name)
        os.makedirs(dst_path, exist_ok=True)
        
        # Get all images and randomly select subset
        images = os.listdir(src_path)
        selected = random.sample(images, min(IMAGES_PER_CLASS_TEST, len(images)))
        
        for img in selected:
            shutil.copy2(os.path.join(src_path, img), os.path.join(dst_path, img))
        
        total_test += len(selected)
        print(f"  {class_name}: {len(selected)} images")
    
    print("\n" + "=" * 50)
    print(f"Limited dataset created!")
    print(f"Total training images: {total_train}")
    print(f"Total test images: {total_test}")
    print(f"\nNew dataset location:")
    print(f"  Train: {DEST_TRAIN}")
    print(f"  Test: {DEST_TEST}")

if __name__ == "__main__":
    random.seed(42)  # For reproducibility
    create_limited_dataset()
