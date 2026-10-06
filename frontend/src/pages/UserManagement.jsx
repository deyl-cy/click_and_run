import { PlusIcon, XIcon, SaveIcon, EditIcon, CheckIcon } from "../components/Icons";
import { useEffect, useState } from "react";
import api from "../services/api";
import "./UserManagement.css";

export default function UserManagement() {
    const [users, setUsers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        role: "analyst",
        is_active: true,
    });

    useEffect(() => {
        loadUsers();
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Load Users
    |--------------------------------------------------------------------------
    */

    async function loadUsers() {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/admin/users");

            /*
             * Laravel paginator response:
             *
             * {
             *   current_page: 1,
             *   data: [...],
             *   last_page: 1,
             *   ...
             * }
             */

            setUsers(response.data.data || []);
        } catch (err) {
            console.error("Unable to load users:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load users."
            );
        } finally {
            setLoading(false);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Form Helpers
    |--------------------------------------------------------------------------
    */

    function resetForm() {
        setForm({
            name: "",
            email: "",
            password: "",
            password_confirmation: "",
            role: "analyst",
            is_active: true,
        });

        setEditingUser(null);
    }

    function openCreateForm() {
        resetForm();

        setError("");
        setSuccess("");

        setShowForm(true);
    }

    function openEditForm(user) {
        setEditingUser(user);

        setForm({
            name: user.name || "",
            email: user.email || "",
            password: "",
            password_confirmation: "",
            role: user.role || "analyst",
            is_active: Boolean(user.is_active),
        });

        setError("");
        setSuccess("");

        setShowForm(true);
    }

    function closeForm() {
        if (saving) {
            return;
        }

        setShowForm(false);
        resetForm();
    }

    /*
    |--------------------------------------------------------------------------
    | Form Change
    |--------------------------------------------------------------------------
    */

    function handleChange(event) {
        const {
            name,
            value,
            type,
            checked,
        } = event.target;

        setForm((current) => ({
            ...current,

            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        }));
    }

    /*
    |--------------------------------------------------------------------------
    | Save User
    |--------------------------------------------------------------------------
    */

    async function handleSubmit(event) {
        event.preventDefault();

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            if (editingUser) {
                /*
                 * UPDATE USER
                 */

                const response = await api.put(
                    `/admin/users/${editingUser.id}`,
                    form
                );

                const updatedUser =
                    response.data.data;

                setUsers((current) =>
                    current.map((user) =>
                        user.id === updatedUser.id
                            ? updatedUser
                            : user
                    )
                );

                setSuccess(
                    "User updated successfully."
                );
            } else {
                /*
                 * CREATE USER
                 */

                const response = await api.post(
                    "/admin/users",
                    form
                );

                const newUser =
                    response.data.data;

                setUsers((current) => [
                    newUser,
                    ...current,
                ]);

                setSuccess(
                    "User created successfully."
                );
            }

            setShowForm(false);
            resetForm();

        } catch (err) {
            console.error(
                "Unable to save user:",
                err
            );

            /*
             * Laravel validation errors
             */

            const validationErrors =
                err.response?.data?.errors;

            if (validationErrors) {
                const firstError =
                    Object.values(validationErrors)
                        .flat()[0];

                setError(
                    firstError ||
                    "Please check the form."
                );
            } else {
                setError(
                    err.response?.data?.message ||
                    "Unable to save user."
                );
            }
        } finally {
            setSaving(false);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Activate / Deactivate User
    |--------------------------------------------------------------------------
    */

    async function toggleStatus(user) {
        setError("");
        setSuccess("");

        try {
            const response = await api.patch(
                `/admin/users/${user.id}/status`,
                {
                    is_active: !user.is_active,
                }
            );

            const updatedUser =
                response.data.data;

            setUsers((current) =>
                current.map((item) =>
                    item.id === updatedUser.id
                        ? updatedUser
                        : item
                )
            );

            setSuccess(
                updatedUser.is_active
                    ? "User activated successfully."
                    : "User deactivated successfully."
            );

        } catch (err) {
            console.error(
                "Unable to update user status:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to update user status."
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Change Role
    |--------------------------------------------------------------------------
    */

    async function changeRole(user, role) {
        if (role === user.role) {
            return;
        }

        setError("");
        setSuccess("");

        try {
            const response = await api.patch(
                `/admin/users/${user.id}/role`,
                {
                    role,
                }
            );

            const updatedUser =
                response.data.data;

            setUsers((current) =>
                current.map((item) =>
                    item.id === updatedUser.id
                        ? updatedUser
                        : item
                )
            );

            setSuccess(
                "User role updated successfully."
            );

        } catch (err) {
            console.error(
                "Unable to update user role:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to update user role."
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Loading State
    |--------------------------------------------------------------------------
    */

    if (loading) {
        return (
            <div className="user-management-page">

                <div className="content-card">

                    <div className="loading-state">
                        Loading users...
                    </div>

                </div>

            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Page
    |--------------------------------------------------------------------------
    */

    return (
        <div className="user-management-page">

            {/* =========================================================
                PAGE HEADER
            ========================================================= */}

            <div className="page-header">

                <div>
                    <h1>
                        User Management
                    </h1>

                    <p>
                        Manage system users, roles,
                        and account status.
                    </p>
                </div>

                <button
                    type="button"
                    className="primary-button"
                    onClick={openCreateForm}
                >
                    <PlusIcon size={17} /> Add User
                </button>

            </div>


            {/* =========================================================
                ERROR
            ========================================================= */}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}


            {/* =========================================================
                SUCCESS
            ========================================================= */}

            {success && (
                <div className="success-message">
                    {success}
                </div>
            )}


            {/* =========================================================
                CREATE / EDIT FORM
            ========================================================= */}

            {showForm && (

                <div className="content-card user-form-card">

                    <div className="reports-header">

                        <div>

                            <h2>
                                {editingUser
                                    ? "Edit User"
                                    : "Create User"}
                            </h2>

                            <p>
                                {editingUser
                                    ? "Update the user's account information."
                                    : "Create a new system user."}
                            </p>

                        </div>

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={closeForm}
                            disabled={saving}
                        >
                            <XIcon size={16} /> Cancel
                        </button>

                    </div>


                    <form
                        className="user-form"
                        onSubmit={handleSubmit}
                    >

                        <div className="form-grid">

                            {/* NAME */}

                            <div className="form-group">

                                <label htmlFor="name">
                                    Full Name
                                </label>

                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Enter full name"
                                    required
                                />

                            </div>


                            {/* EMAIL */}

                            <div className="form-group">

                                <label htmlFor="email">
                                    Email Address
                                </label>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="Enter email address"
                                    required
                                />

                            </div>


                            {/* ROLE */}

                            <div className="form-group">

                                <label htmlFor="role">
                                    Role
                                </label>

                                <input
                                    id="role"
                                    type="text"
                                    value={
                                        editingUser?.role === "admin"
                                            ? "Administrator"
                                            : "Analyst"
                                    }
                                    disabled
                                    readOnly
                                />

                            </div>


                            {/* STATUS */}

                            <div className="form-group">

                                <label>
                                    Account Status
                                </label>

                                <label className="checkbox-label">

                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={form.is_active}
                                        onChange={handleChange}
                                    />

                                    <span>
                                        Account is active
                                    </span>

                                </label>

                            </div>


                            {/* PASSWORD */}

                            <div className="form-group">

                                <label htmlFor="password">

                                    {editingUser
                                        ? "New Password"
                                        : "Password"}

                                </label>

                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder={
                                        editingUser
                                            ? "Leave blank to keep current password"
                                            : "Minimum 8 characters"
                                    }
                                    required={!editingUser}
                                    minLength={8}
                                />

                            </div>


                            {/* CONFIRM PASSWORD */}

                            <div className="form-group">

                                <label htmlFor="password_confirmation">
                                    Confirm Password
                                </label>

                                <input
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    type="password"
                                    value={
                                        form.password_confirmation
                                    }
                                    onChange={handleChange}
                                    placeholder="Confirm password"
                                    required={!editingUser}
                                />

                            </div>

                        </div>


                        {/* FORM ACTIONS */}

                        <div className="form-actions">

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={closeForm}
                                disabled={saving}
                            >
                                <XIcon size={16} /> Cancel
                            </button>

                            <button
                                type="submit"
                                className="primary-button"
                                disabled={saving}
                            >
                                {saving ? "Saving..." : editingUser ? <><SaveIcon size={16} /> Save Changes</> : <><PlusIcon size={16} /> Create User</>}
                            </button>

                        </div>

                    </form>

                </div>

            )}


            {/* =========================================================
                USERS TABLE
            ========================================================= */}

            <div className="content-card">

                <div className="reports-header">

                    <div>

                        <h2>
                            System Users
                        </h2>

                        <p>
                            {users.length} user
                            {users.length === 1
                                ? ""
                                : "s"}
                        </p>

                    </div>

                </div>


                {users.length === 0 ? (

                    <div className="empty-state">

                        <h3>
                            No users found
                        </h3>

                        <p>
                            Create your first user
                            to get started.
                        </p>

                    </div>

                ) : (

                    <div className="table-wrapper">

                        <table className="results-table">

                            <thead>

                                <tr>

                                    <th>
                                        Name
                                    </th>

                                    <th>
                                        Email
                                    </th>

                                    <th>
                                        Role
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Created
                                    </th>

                                    <th>
                                        Actions
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {users.map((user) => (

                                    <tr key={user.id}>

                                        {/* NAME */}

                                        <td>

                                            <strong>
                                                {user.name}
                                            </strong>

                                        </td>


                                        {/* EMAIL */}

                                        <td>
                                            {user.email}
                                        </td>


                                        {/* ROLE */}

                                        <td>

                                            <span
                                                className={
                                                    user.role === "admin"
                                                        ? "role-badge role-badge-admin"
                                                        : "role-badge"
                                                }
                                            >
                                                {user.role === "admin"
                                                    ? "Administrator"
                                                    : "Analyst"}
                                            </span>

                                        </td>


                                        {/* STATUS */}

                                        <td>

                                            <span
                                                className={
                                                    user.is_active
                                                        ? "status-badge status-active"
                                                        : "status-badge status-inactive"
                                                }
                                            >

                                                {user.is_active
                                                    ? "Active"
                                                    : "Inactive"}

                                            </span>

                                        </td>


                                        {/* CREATED */}

                                        <td>

                                            {user.created_at
                                                ? new Date(
                                                    user.created_at
                                                ).toLocaleDateString()
                                                : "—"}

                                        </td>


                                        {/* ACTIONS */}

                                        <td>

                                            <div className="table-actions">

                                                <button
                                                    type="button"
                                                    className="secondary-button"
                                                    onClick={() =>
                                                        openEditForm(user)
                                                    }
                                                >
                                                    <EditIcon size={15} /> Edit
                                                </button>


                                                <button
                                                    type="button"
                                                    className={
                                                        user.is_active
                                                            ? "danger-button"
                                                            : "primary-button"
                                                    }
                                                    onClick={() =>
                                                        toggleStatus(user)
                                                    }
                                                >

                                                    {user.is_active ? <>Deactivate</> : <><CheckIcon size={15} /> Activate</>}

                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>
    );
}