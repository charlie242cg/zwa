export const CLOUDINARY_CONFIG = {
    cloudName: 'dtajc7kty',
    apiKey: '358346747748937',
    uploadPreset: 'zwa_uploads',
};

export const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

    // Use 'auto' to handle images, videos, and other files
    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`,
        {
            method: 'POST',
            body: formData,
        }
    );

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to upload to Cloudinary');
    }

    const data = await response.json();
    console.log("Cloudinary Upload Response Data:", data);
    return data.secure_url;
};
