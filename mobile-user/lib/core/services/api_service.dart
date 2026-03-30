import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../../config/env.dart';
import 'storage_service.dart';
import '../models/artisan.dart';
import '../models/intervention.dart';
import '../models/address.dart';
import '../models/review.dart';

class ApiService {
  final StorageService _storageService;

  ApiService(this._storageService);

  Future<Map<String, String>> _headers() async {
    final token = await _storageService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<dynamic> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse('${Env.apiEndpoint}$path');
    final headers = await _headers();

    debugPrint('[API] $method $path | Token: ${(await _storageService.getToken()) != null ? 'YES' : 'NONE'}');

    http.Response response;
    switch (method) {
      case 'POST':
        response = await http.post(uri, headers: headers, body: body != null ? jsonEncode(body) : null);
        break;
      case 'PUT':
        response = await http.put(uri, headers: headers, body: body != null ? jsonEncode(body) : null);
        break;
      case 'PATCH':
        response = await http.patch(uri, headers: headers, body: body != null ? jsonEncode(body) : null);
        break;
      case 'DELETE':
        response = await http.delete(uri, headers: headers);
        break;
      default:
        response = await http.get(uri, headers: headers);
    }

    debugPrint('[API] $method $path → ${response.statusCode} | Body: ${response.body.length > 500 ? response.body.substring(0, 500) : response.body}');
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      return jsonDecode(response.body);
    } else {
      debugPrint('[API] ERROR: ${response.body}');
      final error = response.body.isNotEmpty
          ? jsonDecode(response.body)
          : {'message': 'Erreur réseau'};
      final msg = error['message'];
      throw ApiException(
        msg is List ? msg.join(', ') : (msg?.toString() ?? 'Erreur lors de la requête'),
        response.statusCode,
      );
    }
  }

  // ========== ARTISANS ==========

  Future<List<Artisan>> searchArtisans({
    double? latitude,
    double? longitude,
    double? radius,
    String? postalCode,
    String? city,
    List<String>? services,
    int? page,
    int? limit,
  }) async {
    final queryParts = <String>[];
    if (latitude != null) queryParts.add('latitude=$latitude');
    if (longitude != null) queryParts.add('longitude=$longitude');
    if (radius != null) queryParts.add('radius=$radius');
    if (postalCode != null) queryParts.add('postalCode=${Uri.encodeComponent(postalCode)}');
    if (city != null) queryParts.add('city=${Uri.encodeComponent(city)}');
    if (page != null) queryParts.add('page=$page');
    if (limit != null) queryParts.add('limit=$limit');
    if (services != null) {
      for (final s in services) {
        queryParts.add('services=${Uri.encodeComponent(s)}');
      }
    }
    final queryString = queryParts.isNotEmpty ? '?${queryParts.join('&')}' : '';
    final uri = Uri.parse('${Env.apiEndpoint}/artisans/search$queryString');
    final headers = await _headers();
    debugPrint('[API] GET /artisans/search$queryString');
    final response = await http.get(uri, headers: headers);
    debugPrint('[API] GET /artisans/search → ${response.statusCode} | Body: ${response.body.length > 300 ? response.body.substring(0, 300) : response.body}');

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final data = jsonDecode(response.body);
      return (data['artisans'] as List).map((a) => Artisan.fromJson(a)).toList();
    } else {
      throw ApiException('Erreur recherche artisans', response.statusCode);
    }
  }

  Future<ArtisanDetail> getArtisanDetail(int id) async {
    final data = await _request('GET', '/artisans/$id');
    return ArtisanDetail.fromJson(data);
  }

  Future<List<String>> getArtisanServices() async {
    final data = await _request('GET', '/artisans/services');
    return List<String>.from(data['services'] ?? []);
  }

  // ========== INSURANCES ==========

  Future<List<Map<String, dynamic>>> getInsurances() async {
    final data = await _request('GET', '/insurances');
    return List<Map<String, dynamic>>.from(data as List);
  }

  // ========== VEHICLES ==========

  Future<Map<String, dynamic>> lookupPlate(String plate) async {
    final data = await _request('GET', '/vehicles/lookup?plate=${Uri.encodeComponent(plate)}');
    return Map<String, dynamic>.from(data);
  }

  // ========== ARTISAN SLOTS ==========

  Future<List<String>> getArtisanSlots(int artisanId, String date) async {
    final data = await _request('GET', '/artisans/$artisanId/slots?date=$date');
    return List<String>.from(data['slots'] ?? []);
  }

  // ========== INTERVENTIONS ==========

  Future<Intervention> createIntervention({
    required int artisanId,
    required String description,
    String? damageType,
    Map<String, dynamic>? vehicleInfo,
    double? latitude,
    double? longitude,
    String? scheduledAt,
    String? insuranceName,
    List<String>? damageZones,
    String? damageCategory,
  }) async {
    final data = await _request('POST', '/interventions', body: {
      'artisanId': artisanId,
      'description': description,
      if (damageType != null) 'damageType': damageType,
      if (vehicleInfo != null) 'vehicleInfo': vehicleInfo,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (scheduledAt != null) 'scheduledAt': scheduledAt,
      if (insuranceName != null) 'insuranceName': insuranceName,
      if (damageZones != null) 'damageZones': damageZones,
      if (damageCategory != null) 'damageCategory': damageCategory,
    });
    return Intervention.fromJson(data);
  }

  Future<Map<String, dynamic>> createGuestIntervention({
    required int artisanId,
    required String description,
    required String guestEmail,
    String? guestPhone,
    String? damageType,
    Map<String, dynamic>? vehicleInfo,
    double? latitude,
    double? longitude,
    String? scheduledAt,
    String? insuranceName,
    List<String>? damageZones,
    String? damageCategory,
  }) async {
    final response = await http.post(
      Uri.parse('${Env.apiEndpoint}/interventions/guest'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'artisanId': artisanId,
        'description': description,
        'guestEmail': guestEmail,
        if (guestPhone != null) 'guestPhone': guestPhone,
        if (damageType != null) 'damageType': damageType,
        if (vehicleInfo != null) 'vehicleInfo': vehicleInfo,
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
        if (scheduledAt != null) 'scheduledAt': scheduledAt,
        if (insuranceName != null) 'insuranceName': insuranceName,
        if (damageZones != null) 'damageZones': damageZones,
        if (damageCategory != null) 'damageCategory': damageCategory,
      }),
    );
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body);
    }
    throw ApiException('Erreur création intervention', response.statusCode);
  }

  Future<Intervention> updateIntervention({
    required int id,
    String? description,
    String? damageType,
    Map<String, dynamic>? vehicleInfo,
    String? scheduledAt,
    String? insuranceName,
    List<String>? damageZones,
    String? damageCategory,
  }) async {
    final data = await _request('PATCH', '/interventions/$id', body: {
      if (description != null) 'description': description,
      if (damageType != null) 'damageType': damageType,
      if (vehicleInfo != null) 'vehicleInfo': vehicleInfo,
      if (scheduledAt != null) 'scheduledAt': scheduledAt,
      if (insuranceName != null) 'insuranceName': insuranceName,
      if (damageZones != null) 'damageZones': damageZones,
      if (damageCategory != null) 'damageCategory': damageCategory,
    });
    return Intervention.fromJson(data);
  }

  Future<List<Intervention>> getMyInterventions() async {
    final data = await _request('GET', '/interventions/my');
    return (data as List).map((i) => Intervention.fromJson(i)).toList();
  }

  Future<List<Intervention>> getGuestInterventions(String email) async {
    final response = await http.get(
      Uri.parse('${Env.apiEndpoint}/interventions/guest/my?email=${Uri.encodeComponent(email)}'),
      headers: {'Content-Type': 'application/json'},
    );
    debugPrint('[API] GET /interventions/guest/my?email=$email → ${response.statusCode}');
    if (response.statusCode >= 200 && response.statusCode < 300) {
      final data = jsonDecode(response.body);
      return (data as List).map((i) => Intervention.fromJson(i)).toList();
    }
    throw ApiException('Erreur récupération interventions', response.statusCode);
  }

  Future<Intervention> getIntervention(int id) async {
    final data = await _request('GET', '/interventions/$id');
    return Intervention.fromJson(data);
  }

  Future<Intervention> getGuestIntervention(int id, String email) async {
    final response = await http.get(
      Uri.parse('${Env.apiEndpoint}/interventions/guest/$id?email=${Uri.encodeComponent(email)}'),
      headers: {'Content-Type': 'application/json'},
    );
    debugPrint('[API] GET /interventions/guest/$id?email=$email → ${response.statusCode}');
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return Intervention.fromJson(jsonDecode(response.body));
    }
    throw ApiException('Erreur récupération intervention', response.statusCode);
  }

  Future<void> cancelIntervention(int id) async {
    await _request('POST', '/interventions/$id/cancel');
  }

  Future<void> acceptQuote(int id) async {
    await _request('POST', '/interventions/$id/accept-quote');
  }

  Future<void> rejectQuote(int id) async {
    await _request('POST', '/interventions/$id/reject-quote');
  }

  Future<void> confirmDone(int id) async {
    await _request('POST', '/interventions/$id/confirm-done');
  }

  Future<String> payIntervention(int id) async {
    final data = await _request('POST', '/interventions/$id/pay');
    return data['clientSecret'] as String;
  }

  Future<void> confirmPayment(int id) async {
    await _request('POST', '/interventions/$id/confirm-payment');
  }

  // ========== ADDRESSES ==========

  Future<List<Address>> getAddresses() async {
    final data = await _request('GET', '/addresses');
    return (data as List).map((a) => Address.fromJson(a)).toList();
  }

  Future<Address> createAddress(Map<String, dynamic> data) async {
    final result = await _request('POST', '/addresses', body: data);
    return Address.fromJson(result);
  }

  Future<Address> updateAddress(int id, Map<String, dynamic> data) async {
    final result = await _request('PUT', '/addresses/$id', body: data);
    return Address.fromJson(result);
  }

  Future<void> deleteAddress(int id) async {
    await _request('DELETE', '/addresses/$id');
  }

  Future<void> setDefaultAddress(int id) async {
    await _request('PATCH', '/addresses/$id/default');
  }

  // ========== USER PROFILE ==========

  Future<void> updateUserProfile(Map<String, dynamic> data) async {
    await _request('PUT', '/users/profile', body: data);
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _request('POST', '/auth/change-password', body: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }

  // ========== REVIEWS ==========

  Future<void> createReview({
    required int interventionId,
    required int rating,
    String? comment,
  }) async {
    await _request('POST', '/reviews', body: {
      'interventionId': interventionId,
      'rating': rating,
      if (comment != null) 'comment': comment,
    });
  }

  Future<List<UserReview>> getMyReviews() async {
    final data = await _request('GET', '/reviews/my');
    return (data as List).map((r) => UserReview.fromJson(r)).toList();
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException(this.message, this.statusCode);

  @override
  String toString() => message;
}
