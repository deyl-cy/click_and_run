export default function StatCard({
    title,
    value,
    description,
    icon,
    tone = "blue",
}) {
    return (
        <div className="stat-card">
            {icon && (
                <div className={`stat-card-icon stat-icon-${tone}`}>
                    {icon}
                </div>
            )}

            <div className="stat-card-title">
                {title}
            </div>

            <div className="stat-card-value">
                {value}
            </div>

            {description && (
                <div className="stat-card-description">
                    {description}
                </div>
            )}
        </div>
    );
}
