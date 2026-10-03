import { ImageIcon, UploadIcon } from "./Icons";
import { useRef, useState } from "react";

export default function ImagePicker({
    onChange,
}) {
    const inputRef = useRef(null);
    const [preview, setPreview] = useState(null);

    function handleChange(event) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const url = URL.createObjectURL(file);

        setPreview(url);

        onChange(file);
    }

    function chooseImage() {
        inputRef.current?.click();
    }

    return (
        <div className="image-picker">

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleChange}
                hidden
            />

            {preview ? (
                <div className="image-preview">
                    <img
                        src={preview}
                        alt="Selected seed batch"
                    />

                    <button type="button" onClick={chooseImage}>
                        <ImageIcon size={16} /> Change Image
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    className="image-dropzone"
                    onClick={chooseImage}
                >
                    <strong><UploadIcon size={28} /> Select seed batch image</strong>

                    <span>
                        JPG, PNG, WEBP
                    </span>
                </button>
            )}

        </div>
    );
}