interface UsersListsProps {
  users: User[] | null;
  showColors: boolean
}

export function UsersList({ users, showColors }: UsersListsProps) {
  return (
    <table>
      <thead>
        <tr>
          <th>Photo</th>
          <th>Name</th>
          <th>Lastname</th>
          <th>Country</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users?.map((user, index) => {
          const backgroundColor = index % 2 === 0 ? '#333' : '#555'
          const color = showColors ? backgroundColor : 'transparent'
          return (
            <tr key={user.login.uuid} style={{backgroundColor: color}}>
              <td>
                <img src={user.picture.medium} alt={user.name.title} />
              </td>
              <td>
                <p>{user.name.first}</p>
              </td>
              <td>
                <p>{user.name.last}</p>
              </td>
              <td>
                <p>{user.location.country}</p>
              </td>
              <td>
                <button>Edit</button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
