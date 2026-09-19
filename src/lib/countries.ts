export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

/**
 * Worldwide country directory with international dialing codes & flags.
 * Default is South Korea (대한민국, +82) as requested.
 */
export const COUNTRIES: Country[] = [
  { code: "KR", name: "South Korea (대한민국)", dialCode: "+82", flag: "🇰🇷" },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
  { code: "JP", name: "Japan (日本)", dialCode: "+81", flag: "🇯🇵" },
  { code: "CN", name: "China (中国)", dialCode: "+86", flag: "🇨🇳" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { code: "IN", name: "India (भारत)", dialCode: "+91", flag: "🇮🇳" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺" },
  { code: "DE", name: "Germany (Deutschland)", dialCode: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬" },
  { code: "AE", name: "United Arab Emirates (الإمارات)", dialCode: "+971", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia (المملكة العربية السعودية)", dialCode: "+966", flag: "🇸🇦" },
  { code: "MY", name: "Malaysia", dialCode: "+60", flag: "🇲🇾" },
  { code: "ID", name: "Indonesia", dialCode: "+62", flag: "🇮🇩" },
  { code: "PH", name: "Philippines", dialCode: "+63", flag: "🇵🇭" },
  { code: "VN", name: "Vietnam (Việt Nam)", dialCode: "+84", flag: "🇻🇳" },
  { code: "TH", name: "Thailand (ไทย)", dialCode: "+66", flag: "🇹🇭" },
  { code: "BD", name: "Bangladesh (বাংলাদেশ)", dialCode: "+880", flag: "🇧🇩" },
  { code: "PK", name: "Pakistan (پاکستان)", dialCode: "+92", flag: "🇵🇰" },
  { code: "RU", name: "Russia (Россия)", dialCode: "+7", flag: "🇷🇺" },
  { code: "BR", name: "Brazil (Brasil)", dialCode: "+55", flag: "🇧🇷" },
  { code: "MX", name: "Mexico (México)", dialCode: "+52", flag: "🇲🇽" },
  { code: "ES", name: "Spain (España)", dialCode: "+34", flag: "🇪🇸" },
  { code: "IT", name: "Italy (Italia)", dialCode: "+39", flag: "🇮🇹" },
  { code: "NL", name: "Netherlands", dialCode: "+31", flag: "🇳🇱" },
  { code: "CH", name: "Switzerland", dialCode: "+41", flag: "🇨🇭" },
  { code: "SE", name: "Sweden (Sverige)", dialCode: "+46", flag: "🇸🇪" },
  { code: "NO", name: "Norway (Norge)", dialCode: "+47", flag: "🇳🇴" },
  { code: "TR", name: "Turkey (Türkiye)", dialCode: "+90", flag: "🇹🇷" },
  { code: "EG", name: "Egypt (مصر)", dialCode: "+20", flag: "🇪🇬" },
  { code: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦" },
  { code: "NG", name: "Nigeria", dialCode: "+234", flag: "🇳🇬" },
  { code: "KE", name: "Kenya", dialCode: "+254", flag: "🇰🇪" },
  { code: "GH", name: "Ghana", dialCode: "+233", flag: "🇬🇭" },
  { code: "NZ", name: "New Zealand", dialCode: "+64", flag: "🇳🇿" },
  { code: "HK", name: "Hong Kong (香港)", dialCode: "+852", flag: "🇭🇰" },
  { code: "TW", name: "Taiwan (台灣)", dialCode: "+886", flag: "🇹🇼" },
  { code: "PL", name: "Poland (Polska)", dialCode: "+48", flag: "🇵🇱" },
  { code: "UA", name: "Ukraine (Україна)", dialCode: "+380", flag: "🇺🇦" },
  { code: "AR", name: "Argentina", dialCode: "+54", flag: "🇦🇷" },
  { code: "CO", name: "Colombia", dialCode: "+57", flag: "🇨🇴" },
  { code: "CL", name: "Chile", dialCode: "+56", flag: "🇨🇱" },
  { code: "PE", name: "Peru (Perú)", dialCode: "+51", flag: "🇵🇪" },
  { code: "QA", name: "Qatar (قطر)", dialCode: "+974", flag: "🇶🇦" },
  { code: "KW", name: "Kuwait (الكويت)", dialCode: "+965", flag: "🇰🇼" },
  { code: "OM", name: "Oman (عُمان)", dialCode: "+968", flag: "🇴🇲" },
  { code: "BH", name: "Bahrain (البحرين)", dialCode: "+973", flag: "🇧🇭" },
  { code: "NP", name: "Nepal (नेपाल)", dialCode: "+977", flag: "🇳🇵" },
  { code: "LK", name: "Sri Lanka (ශ්‍රී ලංකා)", dialCode: "+94", flag: "🇱🇰" },
  { code: "KZ", name: "Kazakhstan (Қазақстан)", dialCode: "+7", flag: "🇰🇿" },
  { code: "UZ", name: "Uzbekistan (Oʻzbekiston)", dialCode: "+998", flag: "🇺🇿" },
  { code: "PT", name: "Portugal", dialCode: "+351", flag: "🇵🇹" },
  { code: "BE", name: "Belgium", dialCode: "+32", flag: "🇧🇪" },
  { code: "AT", name: "Austria (Österreich)", dialCode: "+43", flag: "🇦🇹" },
  { code: "IE", name: "Ireland", dialCode: "+353", flag: "🇮🇪" },
  { code: "IL", name: "Israel (ישראל)", dialCode: "+972", flag: "🇮🇱" },
  { code: "GR", name: "Greece (Ελλάδα)", dialCode: "+30", flag: "🇬🇷" },
  { code: "CZ", name: "Czech Republic (Česko)", dialCode: "+420", flag: "🇨🇿" },
  { code: "RO", name: "Romania (România)", dialCode: "+40", flag: "🇷🇴" },
  { code: "HU", name: "Hungary (Magyarország)", dialCode: "+36", flag: "🇭🇺" },
  { code: "DK", name: "Denmark (Danmark)", dialCode: "+45", flag: "🇩🇰" },
  { code: "FI", name: "Finland (Suomi)", dialCode: "+358", flag: "🇫🇮" },
];

export const DEFAULT_COUNTRY: Country = COUNTRIES[0]; // South Korea (+82)
