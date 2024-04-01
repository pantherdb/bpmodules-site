import { MatColors } from '@pango/mat-colors';

export function getColor(color: string, hue: string | number) {
    const palette = MatColors.getColor(color);
    if (palette) {
        return palette[hue];
    }

    return null;
}

export function getGrayscaleColor(hex: string, percentage: number): string {
    // Ensure the percentage is within the range [0, 100]
    percentage = Math.max(0, Math.min(100, percentage));

    // Convert hex to RGB
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);

    // Calculate the blend with white
    r += Math.round((255 - r) * (1 - (percentage / 100)));
    g += Math.round((255 - g) * (1 - (percentage / 100)));
    b += Math.round((255 - b) * (1 - (percentage / 100)));

    // Convert blended RGB back to hex
    const toHex = (color) => {
        const hex = color.toString(16);
        return hex.length == 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export const geneColors = [
    '#000000', // Black
    '#775c04',
    '#773804',
    '#770464',
    '#270477',
    '#000088',
    '#005e59',
    '#5e2400',
    '#97009a',
    "#9B870C", // Dark Yellow
    "#8FBC8F", // Dark Sea Green
    "#E9967A", // Dark Salmon
]


