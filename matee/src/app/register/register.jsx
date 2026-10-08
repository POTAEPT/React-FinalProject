
export const RegisterPage = () => {
  return (
    <div className="register-page">
        <h1>Register</h1>
        <form>
            <label htmlFor="username">Username:</label>
            <input type="text" id="username" name="username" required />
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" name="email" required />
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" name="password" required />
            <button type="submit">Register</button>
        </form>
    </div>
  );
}