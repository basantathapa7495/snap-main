'use client';

import { useState } from 'react';

type School = {
  id: string;
  name: string;
  school_type: string | null;
  municipality: string | null;
  district: string | null;
  province: string | null;
};

type ProvinceFilterProps = {
  schools: School[];
};

export default function ProvinceFilter({
  schools,
}: ProvinceFilterProps) {
  const [selectedProvince, setSelectedProvince] =
    useState('All');

  const provinces = Array.from(
    new Set(
      schools
        .map((school) => school.province)
        .filter(Boolean)
    )
  ).sort();

  const filteredSchools =
    selectedProvince === 'All'
      ? schools
      : schools.filter(
          (school) =>
            school.province === selectedProvince
        );

  return (
    <div>

      {/* Province selector */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

        <label
          htmlFor="province"
          className="block text-sm font-medium text-gray-700"
        >
          Choose Province
        </label>

        <select
          id="province"
          value={selectedProvince}
          onChange={(e) =>
            setSelectedProvince(e.target.value)
          }
          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="All">
            All Provinces
          </option>

          {provinces.map((province) => (
            <option
              key={province}
              value={province ?? ""}
            >
              {province}
            </option>
          ))}
        </select>

      </div>

      {/* Results */}
      <div className="mt-8">

        <div className="mb-5 flex items-center justify-between">

          <h2 className="text-2xl font-bold text-gray-900">
            {selectedProvince === 'All'
              ? 'All Schools'
              : selectedProvince}
          </h2>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
            {filteredSchools.length}{' '}
            {filteredSchools.length === 1
              ? 'school'
              : 'schools'}
          </span>

        </div>

        {filteredSchools.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="text-gray-500">
              No schools found in this province.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">

            {filteredSchools.map((school) => (
              <a
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
                  ]
                    .filter(Boolean)
                    .join(', ') ||
                    'Location not available'}
                </p>

                <p className="mt-4 text-sm font-medium text-blue-600">
                  View school →
                </p>

              </a>
            ))}

          </div>
        )}

      </div>

    </div>
  );
}