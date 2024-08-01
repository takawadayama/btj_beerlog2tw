import React from 'react';

interface Photo {
  photo_id: number;
  photo_data: string;
}

interface PhotosContainerProps {
  photos: Photo[];
}

const PhotosContainer: React.FC<PhotosContainerProps> = ({ photos }) => {
  return (
    <div>
      <h3 className="text-2xl font-semibold mb-2">最近の投稿</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
        {photos.map(photo => (
          <div key={photo.photo_id} className="relative group">
            <img
              src={`data:image/jpeg;base64,${photo.photo_data}`}
              alt={`Post ${photo.photo_id}`}
              className="w-full h-64 object-cover rounded-2xl transition-transform duration-300 ease-in-out transform group-hover:scale-105"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotosContainer;
