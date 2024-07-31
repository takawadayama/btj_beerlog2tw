export async function fetchUser(userId: number) {
    try {
        const response = await fetch(`http://localhost:8000/user/${userId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch user data: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function fetchUserPhotos(userId: number) {
    try {
        const response = await fetch(`http://localhost:8000/user/${userId}/photos`);
        if (!response.ok) {
            throw new Error(`Failed to fetch user photos: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}
