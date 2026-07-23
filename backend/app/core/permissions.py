from enum import Enum


class Role(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    DESIGNER = "designer"


# Permission mappings
ROLE_PERMISSIONS = {
    Role.OWNER: [
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
    ],
    Role.ADMIN: [
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


def has_permission(role: Role, permission: str) -> bool:
    permissions = ROLE_PERMISSIONS.get(role, [])
    return permission in permissions


def require_permission(role: Role, permission: str) -> bool:
    if not has_permission(role, permission):
        raise PermissionError(f"Role '{role.value}' does not have permission '{permission}'")
    return True
