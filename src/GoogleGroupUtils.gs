// Define the levels for each role
const roleLevels = {
  'OWNER': 3,
  'MANAGER': 2,
  'MEMBER': 1
}

// Function to get the highest auth role
function getHighestRole(roles) {
  let highestRole = null;
  let highestLevel = 0;

  // Iterate through the roles and find the highest level
  roles.forEach(role => {
    const roleLevel = roleLevels[role.name];
    
    if (roleLevel > highestLevel) {
      highestRole = role.name;
      highestLevel = roleLevel;
    }
  });

  return highestRole;
}

function filterMembershipsByEmail(memberships, targetEmail) {
  for (var i = 0; i < memberships.length; i++) {
    var membership = memberships[i];
    if (membership.preferredMemberKey && membership.preferredMemberKey.id === targetEmail) {
      return membership; // Exit early if you only want the first match
    }
  }

  console.warn(`No membership found for email '${targetEmail}'. Returning null.`);
  return null;
}