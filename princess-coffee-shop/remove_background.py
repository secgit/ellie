#!/usr/bin/env python3
"""
Script to remove white background from princess image and create transparent PNG.
"""

from PIL import Image
import os

def remove_white_background(input_path, output_path, threshold=30):
    """
    Remove white background from an image and save as transparent PNG.
    
    Args:
        input_path: Path to input image with white background
        output_path: Path to save transparent output image
        threshold: Color threshold for considering a pixel "white" (0-255)
    """
    try:
        # Open the image
        img = Image.open(input_path)
        
        # Convert to RGBA if not already
        img = img.convert("RGBA")
        
        # Get image data
        data = img.getdata()
        
        # Create new data with transparent background
        new_data = []
        for item in data:
            # Check if pixel is close to white
            if item[0] > (255 - threshold) and item[1] > (255 - threshold) and item[2] > (255 - threshold):
                # Make transparent
                new_data.append((255, 255, 255, 0))
            else:
                # Keep original pixel
                new_data.append(item)
        
        # Update image data
        img.putdata(new_data)
        
        # Save as PNG with transparency
        img.save(output_path, "PNG")
        print(f"Successfully created transparent image: {output_path}")
        
    except Exception as e:
        print(f"Error processing image: {e}")

if __name__ == "__main__":
    input_file = "assets/princess-white-bg.png"
    output_file = "assets/princess-transparent.png"
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"Error: Input file {input_file} not found!")
        exit(1)
    
    # Remove white background
    remove_white_background(input_file, output_file)
    
    print("Background removal complete!")