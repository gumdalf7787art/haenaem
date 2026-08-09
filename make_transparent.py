from PIL import Image
import sys

def make_transparent(input_path, output_path):
    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # Calculate luminance
            lum = (item[0] * 0.299 + item[1] * 0.587 + item[2] * 0.114)
            
            # If it's very dark, feather the alpha
            if lum < 40:
                alpha = int((lum / 40.0) * 255)
                newData.append((item[0], item[1], item[2], alpha))
            else:
                newData.append(item)

        img.putdata(newData)
        img.save(output_path, "PNG")
        print("Success")
    except Exception as e:
        print(f"Error: {e}")

make_transparent("h:/haenaem/hero.png", "h:/haenaem/hero_transparent.png")
