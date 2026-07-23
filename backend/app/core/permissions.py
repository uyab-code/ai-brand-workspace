from enum import Enum


class Role(str, Enum):
    ADMIN = "admin"
    DESIGNER = "designer"


# Permission mappings for organization roles
ROLE_PERMISSIONS = {
    Role.ADMIN: [
        "create_organization",
        "update_organization",
        "invite_member",
        "remove_member",
        "update_member_role",
        "create_client",
        "update_client",
        "delete_client",
        "manage_assets",
        "create_campaign",
        "update_campaign",
        "delete_campaign",
        "create_content",
        "update_content",
        "delete_content",
        "generate_design",
        "approve_design",
        "request_revision",
        "add_comment",
    ],
    Role.DESIGNER: [
        "view_client",
        "view_assets",
        "create_content",
        "update_content",
        "generate_design",
        "add_comment",
    ],
}

# Superadmin has all permissions
SUPERADMIN_PERMISSIONS = [
    "create_organization",
    "update_organization",
    "delete_organization",
    "invite_member",
    "remove_member",
    "update_member_role",
    "create_client",
    "update_client",
    "delete_client",
    "manage_assets",
    "create_campaign",
    "update_campaign",
    "delete_campaign",
    "create_content",
    "update_content",
    "delete_content",
    "generate_design",
    "approve_design",
    "request_revision",
    "add_comment",
    "manage_credits",
    "view_billing",
    "manage_all_organizations",
    "manage_all_users",
]


def has_permission(role: Role, permission: str, is_superuser: bool = False) -> bool:
    # Superadmin has all permissions
    if is_superuser:
        return True
    permissions = ROLE_PERMISSIONS.get(role, [])
    return permission in permissions


def require_permission(role: Role, permission: str, is_superuser: bool = False) -> bool:
    if not has_permission(role, permission, is_superuser):
        raise PermissionError(f"Role '{role.value}' does not have permission '{permission}'")
    return True
