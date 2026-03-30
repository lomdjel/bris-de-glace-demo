class User {
  final int id;
  final String? uid;
  final String email;
  final String firstname;
  final String lastname;
  final String? phone;
  final String role;

  User({required this.id, this.uid, required this.email, required this.firstname, required this.lastname, this.phone, required this.role});

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      uid: json['uid'],
      email: json['email'] ?? '',
      firstname: json['firstname'] ?? '',
      lastname: json['lastname'] ?? '',
      phone: json['phone'],
      role: json['role'] ?? 'user',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id, 'uid': uid, 'email': email, 'firstname': firstname,
    'lastname': lastname, 'phone': phone, 'role': role,
  };

  String get fullName => '$firstname $lastname';
  String get initials => '${firstname.isNotEmpty ? firstname[0] : ''}${lastname.isNotEmpty ? lastname[0] : ''}'.toUpperCase();
}
