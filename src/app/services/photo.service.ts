import { Injectable } from '@angular/core';

import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})

export class PhotoService {

  constructor() { }

  public photos: UserPhoto[] = [];
  private PHOTO_STORAGE: string = 'photos';

  private async readAsBase64(photo: Photo) {
    const response = await fetch(photo.webPath!);
    const blob = await response.blob();

    return await this.convertBlobToBase64(blob) as string;
  }

  private convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    }
    reader.readAsDataURL(blob);
  });

  private async savePicture(photo: Photo) {
    const base64Data = await this.readAsBase64(photo);

    const fileName = new Date().getTime() + '.jpeg'
    await console.log({ fileName: fileName, directory: Directory.Data });
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });

    return {
      filepath: fileName,
      webviewPath: photo.webPath
    };
  }

  public async loadSaved() {
    const photoList = await Preferences.get({ key: this.PHOTO_STORAGE });
    this.photos = JSON.parse(photoList.value || '') || [];

    for(let photo of this.photos) {
      const readFile = await Filesystem.readFile({
        path: photo.filepath,
        directory: Directory.Data
      });

      photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
    }

  }

  public async addNewToGallery() {
    const capturedPhoto = await Camera.getPhoto(
      {
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 100
      }
    );

    const savedImageFile = await this.savePicture(capturedPhoto);
    this.photos.unshift(savedImageFile);

    Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });
  }
}

export interface UserPhoto {
  filepath: string;
  webviewPath: string | undefined;
}
