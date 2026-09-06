'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

type School = {
  id: string;
  name: string;
  school_type: string | null;
  municipality: string | null;
  district: string | null;
  province: string | null;
};

type LocationFilterProps = {
  schools: School[];
};

export default function LocationFilter({
  schools,
}: LocationFilterProps) {
  const [province, setProvince] = useState('All');
  const [district, setDistrict] = useState('All');
  const [municipality, setMunicipality] = useState('All');

  // Provinces
  const provinces = useMemo(() => {
    return Array.from(
      new Set(
        schools
          .map((school) => school.province)
          .filter(Boolean)
      )
    ).sort();
  }, [schools]);

  // Districts belonging to selected province
  const districts = useMemo(() => {
    const filtered =
      province === 'All'
        ? schools
        : schools.filter(
            (school) => school.province === province
          );

    return Array.from(
      new Set(
        filtered
          .map((school) => school.district)
          .filter(Boolean)
      )
    ).sort();
  }, [schools, province]);

  // Municipalities belonging to selected province + district
  const municipalities = useMemo(() => {
    const filtered = schools.filter((school) => {
      const provinceMatch =
        province === 'All' ||
        school.province === province;

      const districtMatch =
        district === 'All' ||
        school.district === district;

      return provinceMatch && districtMatch;
    });

    return Array.from(
      new Set(
        filtered
          .map((school) => school.municipality)
          .filter(Boolean)
      )
    ).sort();
  }, [schools, province, district]);

  // Final filtered schools
  const filteredSchools = useMemo(() => {
    return schools.filter((school) => {
      const provinceMatch =
        province === 'All' ||
        school.province === province;

      const districtMatch =
        district === 'All' ||
        school.district === district;

      const municipalityMatch =
        municipality === 'All' ||
        school.municipality === municipality;

      return (
        provinceMatch &&
        districtMatch &&
        municipalityMatch
      );
    });
  }, [schools, province, district, municipality]);

  function handleProvinceChange(
    value: string
  ) {
    setProvince(value);
    setDistrict('All');
    setMunicipality('All');
  }

  function handleDistrictChange(
    value: string
  ) {
    setDistrict(value);
    setMunicipality('All');
  }

  return (
    <div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

        <h2 className="text-xl font-semibold text-gray-900">
          Find a School
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Select a province, district and municipality.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-3">

          {/* Province */}
          <div>
            <label
              htmlFor="province"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Province
            </label>

            <select
              id="province"
              value={province ?? ""}
              onChange={(e) =>
                handleProvinceChange(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">
                All Provinces
              </option>

              {provinces.map((item) => (
                <option
                  key={item}
                  value={item?? ""}
                >
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <label
              htmlFor="district"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              District
            </label>

            <select
              id="district"
              value={district ?? ""}
              onChange={(e) =>
                handleDistrictChange(
                  e.target.value
                )
              }
              disabled={
                province === 'All'
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">
                {province === 'All'
                  ? 'Select province first'
                  : 'All Districts'}
              </option>

              {districts.map((item) => (
                <option
                  key={item}
                  value={item?? ""}
                >
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* Municipality */}
          <div>
            <label
              htmlFor="municipality"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Municipality
            </label>

            <select
              id="municipality"
              value={municipality ?? ""}
              onChange={(e) =>
                setMunicipality(
                  e.target.value
                )
              }
              disabled={
                province === 'All' ||
                district === 'All'
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">
                {district === 'All'
                  ? 'Select district first'
                  : 'All Municipalities'}
              </option>

              {municipalities.map((item) => (
                <option
                  key={item}
                  value={item?? ""}
                >
                  {item}
                </option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* Results */}
      <div className="mt-8">

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Schools
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {province !== 'All' &&
                `${province}`}

              {district !== 'All' &&
                ` → ${district}`}

              {municipality !== 'All' &&
                ` → ${municipality}`}
            </p>
          </div>

          <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
            {filteredSchools.length}{' '}
            {filteredSchools.length === 1
              ? 'school'
              : 'schools'}
          </span>

        </div>

        {filteredSchools.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">

            <p className="text-lg font-medium text-gray-900">
              No schools found
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Try selecting a different location.
            </p>

          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">

            {filteredSchools.map((school) => (
              <Link
                key={school.id}
                href={`/schools/${school.id}`}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
              >

                <h3 className="text-lg font-semibold text-gray-900">
                  {school.name}
                </h3>

                {school.school_type && (
                  <p className="mt-1 text-sm font-medium text-blue-600">
                    {school.school_type}
                  </p>
                )}

                <p className="mt-3 text-sm text-gray-600">
                  📍{' '}
                  {[
                    school.municipality,
                    school.district,
                    school.province,
                  ]
                    .filter(Boolean)
                    .join(', ') ||
                    'Location not available'}
                </p>

                <p className="mt-4 text-sm font-medium text-blue-600">
                  View school →
                </p>

              </Link>
            ))}

          </div>
        )}

      </div>

    </div>
  );
}