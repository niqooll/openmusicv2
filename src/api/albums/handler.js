const autoBind = require('auto-bind');
const InvariantError = require('../../exceptions/InvariantError');

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
    // Dengan konfigurasi rute Anda, payload adalah stream itu sendiri, bukan objek.
    const data = request.payload;
    const { id: albumId } = request.params;

    // Pastikan payload (stream) memiliki metadata .hapi
    if (!data || !data.hapi) {
      throw new InvariantError('Payload atau metadata file tidak valid');
    }

    const { headers, filename } = data.hapi;

    // Validasi tipe file dari header stream
    this._uploadValidator.validateImageHeaders(headers);

    // Cek album
    await this._service.getAlbumById(albumId);

    // Tulis file menggunakan stream dan metadatanya
    const fileLocation = await this._storageService.writeFile(data, { filename, headers });
    
    // Bentuk URL lengkap
    const coverUrl = `http://${process.env.HOST}:${process.env.PORT}/upload/images/${fileLocation}`;
    
    await this._service.addAlbumCover(albumId, coverUrl);

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