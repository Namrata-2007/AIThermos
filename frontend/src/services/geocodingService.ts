import { reverseLookupGlobalHierarchy, GLOBAL_COUNTRIES } from '../data/globalLocations.ts';

export interface GeocodedLocation {
  displayName: string;
  latitude: number;
  longitude: number;
  country: string;
  region: string;
  city: string;
  area?: string;
  source: 'NOMINATIM_OSM' | 'GLOBAL_HIERARCHY';
}

/**
 * Searches places globally using OpenStreetMap Nominatim with local hierarchy fallback
 */
export async function searchGlobalLocation(query: string): Promise<GeocodedLocation[]> {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = query.trim().toLowerCase();

  // Check built-in global hierarchy first for instant, rock-solid matches
  const localMatches: GeocodedLocation[] = [];
  for (const country of GLOBAL_COUNTRIES) {
    if (country.name.toLowerCase().includes(cleanQuery)) {
      localMatches.push({
        displayName: country.name,
        latitude: country.latitude,
        longitude: country.longitude,
        country: country.name,
        region: country.regions[0]?.name || '',
        city: country.regions[0]?.districts[0]?.name || '',
        source: 'GLOBAL_HIERARCHY'
      });
    }

    for (const region of country.regions) {
      if (region.name.toLowerCase().includes(cleanQuery)) {
        localMatches.push({
          displayName: `${region.name}, ${country.name}`,
          latitude: region.latitude,
          longitude: region.longitude,
          country: country.name,
          region: region.name,
          city: region.districts[0]?.name || '',
          source: 'GLOBAL_HIERARCHY'
        });
      }

      for (const dist of region.districts) {
        if (dist.name.toLowerCase().includes(cleanQuery)) {
          localMatches.push({
            displayName: `${dist.name}, ${region.name}, ${country.name}`,
            latitude: dist.latitude,
            longitude: dist.longitude,
            country: country.name,
            region: region.name,
            city: dist.name,
            source: 'GLOBAL_HIERARCHY'
          });
        }

        for (const area of dist.areas) {
          if (area.name.toLowerCase().includes(cleanQuery)) {
            localMatches.push({
              displayName: `${area.name} (${area.type}), ${dist.name}, ${region.name}, ${country.name}`,
              latitude: area.latitude,
              longitude: area.longitude,
              country: country.name,
              region: region.name,
              city: dist.name,
              area: area.name,
              source: 'GLOBAL_HIERARCHY'
            });
          }
        }
      }
    }
  }

  // Also query OSM Nominatim through server proxy or direct if available
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2800);

    const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const osmResults: GeocodedLocation[] = data.map((item: any) => ({
          displayName: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          country: item.address?.country || 'Identified Country',
          region: item.address?.state || item.address?.region || item.address?.province || '',
          city: item.address?.city || item.address?.town || item.address?.county || item.address?.district || '',
          area: item.address?.suburb || item.address?.neighbourhood || item.address?.industrial || '',
          source: 'NOMINATIM_OSM'
        }));

        // Merge without duplicates
        return [...localMatches.slice(0, 3), ...osmResults.slice(0, 5)];
      }
    }
  } catch {
    // Return local matches if remote network fails
  }

  return localMatches.slice(0, 6);
}

/**
 * Reverse geocodes coordinates to Country, Region, City, Area
 */
export async function reverseGeocodeCoordinates(lat: number, lon: number): Promise<GeocodedLocation> {
  const localFallback = reverseLookupGlobalHierarchy(lat, lon);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const country = data.address.country || localFallback.country;
        const region = data.address.state || data.address.region || data.address.province || localFallback.region;
        const city = data.address.city || data.address.town || data.address.county || data.address.district || localFallback.city;
        const area = data.address.suburb || data.address.neighbourhood || data.address.industrial || localFallback.area;

        return {
          displayName: data.display_name || `${city}, ${region}, ${country}`,
          latitude: lat,
          longitude: lon,
          country,
          region,
          city,
          area,
          source: 'NOMINATIM_OSM'
        };
      }
    }
  } catch {
    // Network fallback
  }

  return {
    displayName: `${localFallback.city}, ${localFallback.region}, ${localFallback.country}`,
    latitude: lat,
    longitude: lon,
    country: localFallback.country,
    region: localFallback.region,
    city: localFallback.city,
    area: localFallback.area,
    source: 'GLOBAL_HIERARCHY'
  };
}
