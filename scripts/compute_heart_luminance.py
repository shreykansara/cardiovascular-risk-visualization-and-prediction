from PIL import Image
import numpy as np

def compute_heart_luminance(image_path):
    img = Image.open(image_path).convert('RGB')
    arr = np.array(img, dtype=np.float32)

    # Background color in baseline is rgb(246, 247, 249)
    bg = np.array([246, 247, 249], dtype=np.float32)

    # Color difference from background
    diff = np.sqrt(np.sum((arr - bg) ** 2, axis=-1))

    # Mask of heart pixels (diff > 15 to exclude slight anti-aliasing on background)
    heart_mask = diff > 15

    heart_count = np.sum(heart_mask)
    total_pixels = arr.shape[0] * arr.shape[1]
    occupancy = (heart_count / total_pixels) * 100

    heart_pixels = arr[heart_mask]
    if len(heart_pixels) == 0:
        return 0, 0, 0

    # sRGB relative luminance (0 to 255)
    lum = 0.2126 * heart_pixels[:, 0] + 0.7152 * heart_pixels[:, 1] + 0.0722 * heart_pixels[:, 2]
    mean_lum = float(np.mean(lum))
    mean_lum_normalized = mean_lum / 255.0

    print(f"Image: {image_path}")
    print(f"Total pixels: {total_pixels}, Heart pixels: {heart_count} ({occupancy:.2f}%)")
    print(f"Mean luminance (0-255): {mean_lum:.2f}")
    print(f"Mean luminance (0-1): {mean_lum_normalized:.4f}")
    return mean_lum, mean_lum_normalized, occupancy

if __name__ == '__main__':
    for view in ['front', 'left', 'back', 'right']:
        p = f"docs/screenshots/round4/viewer-baseline/{view}.png"
        compute_heart_luminance(p)
