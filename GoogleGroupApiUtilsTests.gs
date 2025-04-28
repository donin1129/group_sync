function testLookupGroupIdByGroupEmail() {
  var groupEmail = "test.group@ccc-munich.org";
  var groupId = lookupGroupIdByGroupEmail(groupEmail);
  console.log(groupId);
}

function testAddUserToGroup() {
  var groupEmail = "test.group@ccc-munich.org";
  var groupId = lookupGroupIdByGroupEmail(groupEmail);
  addUserToGroup(groupId, "zhetao.dong@gmail.com", "MEMBER");
}

function testDeleteUserFromGroup() {
  var groupEmail = "test.group@ccc-munich.org";
  var groupId = lookupGroupIdByGroupEmail(groupEmail);
  const allMemberships = listMembershipsByGroupId(groupId);
  const membership = filterMembershipsByEmail(allMemberships, "zhetao.dong@gmail.com");
  deleteUserFromGroup(membership['name']);
}

function testListMembershipsByGroupId() {
  var groupEmail = "test.group@ccc-munich.org";
  var groupId = lookupGroupIdByGroupEmail(groupEmail);
  const result = listMembershipsByGroupId(groupId)
  console.log(result);
}

function testUpdateUserRoleFromGroup() {
  var groupEmail = "test.group@ccc-munich.org";
  var groupId = lookupGroupIdByGroupEmail(groupEmail);
  const allMemberships = listMembershipsByGroupId(groupId);
  const membership = filterMembershipsByEmail(allMemberships, "zhetao.dong@gmail.com");
  updateUserRoleFromGroup(membership.name, membership.roles, 'MANAGER');
}
