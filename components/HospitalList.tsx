
import React from 'react';
import { GroundingChunk, HospitalInfo } from '../types';

interface HospitalListProps {
  groundingMetadata: any;
  hospitalDetails?: HospitalInfo[];
  title?: string;
}

const HospitalList: React.FC<HospitalListProps> = ({ groundingMetadata, hospitalDetails, title }) => {
  const chunks = groundingMetadata?.groundingChunks || [];
  const mapsChunks = chunks.filter((c: GroundingChunk) => c.maps);
  const webChunks = chunks.filter((c: GroundingChunk) => c.web);

  const hasDetails = hospitalDetails && hospitalDetails.length > 0;

  if (!hasDetails && mapsChunks.length === 0 && webChunks.length === 0) return null;

  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-xl font-bold text-gray-900 flex items-center">
        <svg className="w-6 h-6 mr-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
        {title || "Recommended Nearby Facilities"}
      </h3>
      
      <div className="space-y-4">
        {hasDetails ? (
          hospitalDetails?.map((hospital, idx) => {
            const mapLink = mapsChunks.find((c: GroundingChunk) => 
              c.maps?.title.toLowerCase().includes(hospital.name.toLowerCase()) ||
              hospital.name.toLowerCase().includes(c.maps?.title.toLowerCase() || '')
            );

            return (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-gray-900 leading-tight">{hospital.name}</h4>
                    {hospital.website && (
                      <a 
                        href={hospital.website.startsWith('http') ? hospital.website : `https://${hospital.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-xs font-medium hover:underline flex items-center mt-1"
                      >
                        Visit Official Website
                        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                  <div className="bg-blue-50 border border-blue-100 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-lg flex flex-col items-end">
                    <span className="text-[10px] uppercase opacity-60">Estimated Fee</span>
                    <span>{hospital.estimatedFees}</span>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm text-gray-600">
                  <p className="flex items-start">
                    <svg className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {hospital.address}
                  </p>
                  
                  {hospital.contact && (
                    <p className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 