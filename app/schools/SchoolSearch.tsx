'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import DeleteSchoolButton from './DeleteSchoolButton';

type School = {
  id: string;
  name: string;
  school_type: string | null;
  address: string | null;
  municipality: string | null;
  district: string | null;
  province: string | null;
  phone: string | null;
  email: string | null;
};

type SchoolSearchProps = {
  schools: School[];
};

export default function SchoolSearch({ schools }: SchoolSearchProps) {
  const [search, setSearch] = useState('');
  const [schoolType, setSchoolType] = useState('');
  const [province, setProvince] = useState('');

  const types = useMemo(
    () =>
      Array.from(
        new Set(
          schools
            .map((school) => school.school_type)
            .filter(Boolean)
        )
      ) as string[],
    [schools]
  );

  const provinces = useMemo(
    () =>
      Array.from(
        new Set(
          schools
            .map((school) => school.province)
            .filter(Boolean)
        )
      ) as string[],
    [schools]
  );

  const filteredSchools = schools.filter((school) => {
    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      !searchText ||
      school.name?.toLowerCase().includes(searchText) ||
      school.address?.toLowerCase().includes(searchText) ||
      school.municipality?.toLowerCase().includes(searchText) ||
      school.district?.toLowerCase().includes(searchText) ||
      school.province?.toLowerCase().includes(searchText);

    const matchesType =
      !schoolType || school.school_type === schoolType;

    const matchesProvince =
      !province || school.province === province;

    return matchesSearch && matchesType && matchesProvince;
  });

  return (
    <>
      {/* Search and filters */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">

          <div className="md:col-span-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Search
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search schools..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              School Type
            </label>

            <select
              value={schoolType}
              onChange={(e) => setSchoolType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500"
            >
              <option value="">All Types</option>

              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Province
            </label>

            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500"
            >
              <option value="">All Provinces</option>

              {provinces.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing{' '}
            <span className="font-semibold text-gray-900">
              {filteredSchools.length}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-gray-900">
              {schools.length}
            </span>{' '}
            schools
          </p>

          {(search || schoolType || province) && (
            <button
              onClick={() => {
                setSearch('');
                setSchoolType('');
                setProvince('');
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Schools */}
      {filteredSchools.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            No schools found
          </h2>

          <p className="mt-2 text-gray-500">
            Try changing your search or filters.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {filteredSchools.map((school) => (
            <div
              key={school.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <Link
                href={`/schools/${school.id}`}
                className="text-xl font-semibold text-gray-900 hover:text-blue-600"
              >
                {school.name}
              </Link>

              <p className="mt-2 text-gray-600">
                📍 {school.address || 'Address not available'}
              </p>

              <div className="mt-4 space-y-1 text-sm text-gray-600">
                {school.phone && <p>📞 {school.phone}</p>}
                {school.email && <p>✉️ {school.email}</p>}
              </div>

              <div className="mt-6 flex gap-3 border-t border-gray-100 pt-4">
                <Link
                  href={`/schools/${school.id}`}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  View Details
                </Link>

                <Link
                  href={`/schools/${school.id}/edit`}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </Link>

                <DeleteSchoolButton id={school.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}