// src/app/user/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { fetchUser, fetchUserPhotos } from './fetchUser';
import { User, Photo } from './types';

interface UserPageProps {
    userId: number;
}

function UserPage({ userId }: UserPageProps) {
    const [user, setUser] = useState<User | null>(null);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function getUserData() {
            try {
                const userData = await fetchUser(userId);
                setUser(userData);
                const userPhotos = await fetchUserPhotos(userId);
                setPhotos(userPhotos);
            } catch (error) {
                if (error instanceof Error) {
                    setError(error.message);
                } else {
                    setError("An unknown error occurred");
                }
            }
        }

        getUserData();
    }, [userId]);

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <header>
                <img src={user.user_picture} alt={user.user_name} />
                <h1>{user.user_name}</h1>
                <p>{user.user_profile}</p>
            </header>
            <section>
                <h2>最近の投稿</h2>
                <div>
                    {photos.map(photo => (
                        <img key={photo.photo_id} src={URL.createObjectURL(new Blob([photo.photo_data]))} alt="user photo" />
                    ))}
                </div>
            </section>
        </div>
    );
}

export default UserPage;
