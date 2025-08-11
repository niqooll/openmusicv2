//src/api/albums/handler.js
const autoBind = require('auto-bind');
const fs = require('fs');
const path = require('path');

class AlbumsHandler {
  constructor(service, storageService, validator, uploadValidator) {
    this._service = service;
    this._storageService = storageService;
    this._validator = validator;
    this._uploadValidator = uploadValidator;
    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;

    const albumId = await this._service.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    const album = await this._service.getAlbumWithSongs(id);

    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;

    await this._service.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postUploadImageHandler(request, h) {
    const { cover } = request.payload;
    const { id } = request.params;

    this._uploadValidator.validateImageHeaders(cover.hapi.headers);

    let coverUrl;

    if (process.env.AWS_BUCKET_NAME) {
      // Upload ke S3
      coverUrl = await this._storageService.uploadFile(cover, cover.hapi);
    } else {
      // Upload ke local storage
      const filename = await this._storageService.writeFile(cover, cover.hapi);
      coverUrl = `http://${process.env.HOST}:${process.env.PORT}/upload/images/${filename}`;
    }

    await this._service.addAlbumCover(id, coverUrl);

    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });
    response.code(201);
    return response;
  }

  async postLikeAlbumHandler(request, h) {
    const { id: albumId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._service.addAlbumLike(userId, albumId);

    const response = h.response({
      status: 'success',
      message: 'Album berhasil disukai',
    });
    response.code(201);
    return response;
  }

  async deleteLikeAlbumHandler(request) {
    const { id: albumId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._service.deleteAlbumLike(userId, albumId);

    return {
      status: 'success',
      message: 'Album batal disukai',
    };
  }

  async getAlbumLikesHandler(request, h) {
    const { id: albumId } = request.params;
    
    const { likes, source } = await this._service.getAlbumLikes(albumId);

    const response = h.response({
      status: 'success',
      data: {
        likes,
      },
    });

    if (source === 'cache') {
      response.header('X-Data-Source', 'cache');
    }

    return response;
  }
}

module.exports = AlbumsHandler;