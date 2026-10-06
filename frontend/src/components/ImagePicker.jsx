import { ImageIcon, UploadIcon } from "./Icons";
import { useRef, useState } from "react";
import { alertError } from "../utils/alert";

// Same limits as the backend (AnalysisController): jpg, png, webp, 15 MB.
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 15;

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

        if (!ALLOWED_TYPES.includes(file.type)) {
            alertError(
                "Please choose a JPG, PNG or WEBP image.",
                "Unsupported file type"
            );
            event.target.value = "";
            return;
        }

        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            alertError(
                `The image is too large. The maximum size is ${MAX_SIZE_MB} MB.`,
                "Image too large"
            );
            event.target.value = "";
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