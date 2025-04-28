function buildUrlWithQueryParams(baseUrl, params) {

  var queryParts = [];

  function flatten(obj, prefix) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        var value = obj[key];
        var newKey = prefix ? prefix + "." + key : key;

        if (typeof value === "object" && value !== null) {
          flatten(value, newKey); // Recursively flatten
        } else {
          queryParts.push(newKey + "=" + value);
        }
      }
    }
  }

  flatten(params, "");

  var queryString = queryParts.join("&");
  return baseUrl + "?" + queryString;
}

function getMembershipRolesFromRoleType(roleType) {
  // Always include MEMBER role if MANAGER or OWNER
  var roles = [{ name: "MEMBER" }];
  if (roleType !== "MEMBER") {
    roles.push({ name: roleType });
  }
  return roles
}

function lookupGroupIdByGroupEmail(groupEmail) {
  // See documentation https://cloud.google.com/identity/docs/reference/rest/v1/groups/lookup

  var url = "https://cloudidentity.googleapis.com/v1/groups:lookup";

  var params = {
    groupKey: {
      id: groupEmail
    }
  };

  var endpoint = buildUrlWithQueryParams(url, params);

  var options = {
    method: "get",
    headers: {
      Authorization: "Bearer " + ScriptApp.getOAuthToken()
    },
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(endpoint, options);

  if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
    var result = JSON.parse(response.getContentText());
    return result['name'];
  } else {
    var result = JSON.parse(response.getContentText());
    throw new Error(JSON.stringify(result));
  }
}

function addUserToGroup(groupId, memberEmail, roleType) {
  // See documentation https://cloud.google.com/identity/docs/reference/rest/v1/groups.memberships/create

  if (!["MEMBER", "MANAGER", "OWNER"].includes(roleType)) {
    throw new Error("Invalid roleType. Must be one of: MEMBER, MANAGER, OWNER");
  }
  var baseUrl = `https://cloudidentity.googleapis.com/v1/${groupId}/memberships`;

  var payload = {
    preferredMemberKey: {
      id: memberEmail
    },
    roles: getMembershipRolesFromRoleType(roleType)
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + ScriptApp.getOAuthToken()
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(baseUrl, options);
  
  if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
    return JSON.parse(response.getContentText());
  } else {
    var result = JSON.parse(response.getContentText());
    throw new Error(JSON.stringify(result));
  }
}

function deleteUserFromGroup(name) {
  // See documentation https://cloud.google.com/identity/docs/reference/rest/v1/groups.memberships/delete

  // name such as groups/{group}/memberships/{membership}

  var baseUrl = `https://cloudidentity.googleapis.com/v1/${name}`;

  var options = {
    method: "delete",
    headers: {
      Authorization: "Bearer " + ScriptApp.getOAuthToken()
    },
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(baseUrl, options);

  if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
    return JSON.parse(response.getContentText());
  } else {
    var result = JSON.parse(response.getContentText());
    throw new Error(JSON.stringify(result));
  }
}

function updateUserRoleFromGroup(name, currentRoles, updatedRoleType) {
  // See documentation https://cloud.google.com/identity/docs/reference/rest/v1/groups.memberships/delete

  // name such as groups/{group}/memberships/{membership}
  // currentRoles such as [ { name: 'MEMBER' } ]
  // updatedRoleType such as 'MEMBER'

  if (getHighestRole(currentRoles) === updatedRoleType) {
    console.log(`User highest role for member ${name} does not require change.`);
    return
  }

  var baseUrl = `https://cloudidentity.googleapis.com/v1/${name}:modifyMembershipRoles`;

  var payload = {
    removeRoles: currentRoles.filter(role => role.name !== 'MEMBER').map(role => role.name),
    addRoles: getMembershipRolesFromRoleType(updatedRoleType).filter(role => role.name !== 'MEMBER')
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + ScriptApp.getOAuthToken()
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(baseUrl, options);

  if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
    return JSON.parse(response.getContentText());
  } else {
    var result = JSON.parse(response.getContentText());
    throw new Error(JSON.stringify(result));
  }
}

function listMembershipsByGroupId(groupId) {
  // See documentation https://cloud.google.com/identity/docs/reference/rest/v1/groups.memberships/list

  var baseUrl = `https://cloudidentity.googleapis.com/v1/${groupId}/memberships`;
  var memberships = [];
  var nextPageToken = null;
  var pageSize = null;

  do {
    var queryParams = {
      pageSize: pageSize || 1000,
    };

    if (nextPageToken) {
      queryParams.pageToken = nextPageToken;
    }

    var url = buildUrlWithQueryParams(baseUrl, queryParams);

    var options = {
      method: "get",
      headers: {
        Authorization: "Bearer " + ScriptApp.getOAuthToken()
      },
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(url, options);

    if (!(response.getResponseCode() >= 200 && response.getResponseCode() < 300)) {
      var result = JSON.parse(response.getContentText());
      throw new Error(JSON.stringify(result));
    }

    var data = JSON.parse(response.getContentText());

    if (data.memberships) {
      memberships = memberships.concat(data.memberships);
    }

    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  return memberships;

}
