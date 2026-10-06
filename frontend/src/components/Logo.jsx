/*
| Click & Run logo: a rice grain with a sprout.
|   <Logo size={40} />                 dark tile, white grain
|   <Logo size={48} variant="light" /> white tile, dark grain
*/
export default function Logo({ size = 40, variant = "dark" }) {
    const bg = variant === "light" ? "#ffffff" : "#111827";
    const fg = variant === "light" ? "#111827" : "#ffffff";

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            role="img"
            aria-label="Click & Run"
            style={{ display: "block", flexShrink: 0 }}
        >
            <rect width="64" height="64" rx="16" fill={bg} />

            {/* rice grain */}
            <g transform="rotate(-28 32 38)">
                <path
                    d="M32 22 C43 30 43 48 32 57 C21 48 21 30 32 22 Z"
                    fill={fg}
                />
                <path
                    d="M32 28 L32 51"
                    stroke={bg}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                />
            </g>

            {/* sprout leaf */}
            <path
                d="M34 24 C34 15 41 10 50 11 C50 20 43 25 34 24 Z"
                fill={fg}
            />
        </svg>
    );
}
