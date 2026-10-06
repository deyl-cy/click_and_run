/*
| Bootstrap Icons wrappers.
| Same names and `size` prop as before, so existing code keeps working:
|   <XIcon size={16} />
|
| Browse more icons at https://icons.getbootstrap.com
*/

export function BI({ name, size = 16, className = "", style }) {
    return (
        <i
            className={`bi bi-${name} ${className}`.trim()}
            style={{
                fontSize: size,
                lineHeight: 1,
                verticalAlign: "-0.125em",
                ...style,
            }}
            aria-hidden="true"
        />
    );
}

/* Names used by the pages right now */
export const PlusIcon = (props) => <BI name="plus-lg" {...props} />;
export const XIcon = (props) => <BI name="x-lg" {...props} />;
export const SaveIcon = (props) => <BI name="save" {...props} />;
export const PdfIcon = (props) => <BI name="file-earmark-pdf" {...props} />;
export const ExcelIcon = (props) => <BI name="file-earmark-excel" {...props} />;
export const EditIcon = (props) => <BI name="pencil-square" {...props} />;
export const TrashIcon = (props) => <BI name="trash" {...props} />;
export const ScanIcon = (props) => <BI name="search" {...props} />;

/* Extras you can use anywhere */
export const DashboardIcon = (props) => <BI name="speedometer2" {...props} />;
export const NewTestIcon = (props) => <BI name="plus-circle" {...props} />;
export const ReportsIcon = (props) => <BI name="table" {...props} />;
export const UsersIcon = (props) => <BI name="people" {...props} />;
export const LogoutIcon = (props) => <BI name="box-arrow-right" {...props} />;
export const DownloadIcon = (props) => <BI name="download" {...props} />;
export const CheckIcon = (props) => <BI name="check-lg" {...props} />;
export const BackIcon = (props) => <BI name="arrow-left" {...props} />;
export const EyeIcon = (props) => <BI name="eye" {...props} />;

/* Names the pages import */
export const ArrowRightIcon = (props) => <BI name="arrow-right" {...props} />;
export const ChevronLeftIcon = (props) => <BI name="chevron-left" {...props} />;
export const ChevronRightIcon = (props) => <BI name="chevron-right" {...props} />;
export const ClipboardIcon = (props) => <BI name="clipboard-data" {...props} />;
export const ImageIcon = (props) => <BI name="image" {...props} />;
export const LogOutIcon = (props) => <BI name="box-arrow-right" {...props} />;
export const RefreshIcon = (props) => <BI name="arrow-clockwise" {...props} />;
export const SearchIcon = (props) => <BI name="search" {...props} />;
export const SettingsIcon = (props) => <BI name="gear" {...props} />;
export const UploadIcon = (props) => <BI name="upload" {...props} />;
export const HomeIcon = (props) => <BI name="house-door" {...props} />;
export const AdminIcon = (props) => <BI name="shield-check" {...props} />;

/* Dashboard cards */
export const ReportFileIcon = (props) => <BI name="file-earmark-text" {...props} />;
export const SeedIcon = (props) => <BI name="flower2" {...props} />;
export const ViabilityIcon = (props) => <BI name="heart-pulse" {...props} />;
export const GerminationIcon = (props) => <BI name="graph-up-arrow" {...props} />;
export const EyeSlashIcon = (props) => <BI name="eye-slash" {...props} />;
export const CameraIcon = (props) => <BI name="camera" {...props} />;
export const CpuIcon = (props) => <BI name="cpu" {...props} />;
export const ClipboardCheckIcon = (props) => <BI name="clipboard-check" {...props} />;
