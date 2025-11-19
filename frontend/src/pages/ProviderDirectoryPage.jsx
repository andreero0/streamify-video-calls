import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { getRecommendedUsers } from "../lib/api";
import { Heart, MapPin, Calendar, CheckCircle, Search, Filter } from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";

const ProviderDirectoryPage = () => {
  const { authUser } = useAuthUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["providers", selectedSpecialty],
    queryFn: () => getRecommendedUsers({ role: "provider", specialty: selectedSpecialty }),
  });

  const providers = data?.users || [];

  // Extract unique specialties from providers
  const specialties = [...new Set(providers.map((p) => p.healthcareProfile?.specialty).filter(Boolean))];

  // Filter providers based on search term
  const filteredProviders = providers.filter((provider) => {
    const matchesSearch =
      searchTerm === "" ||
      provider.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.healthcareProfile?.specialty?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Find a Provider</h1>
          <p className="text-base-content/70">Browse healthcare providers and book appointments</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="card bg-base-100 shadow-lg mb-6">
          <div className="card-body">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="form-control flex-1">
                <div className="input-group">
                  <span className="bg-base-200">
                    <Search className="size-5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by name or specialty..."
                    className="input input-bordered flex-1"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Specialty Filter */}
              <div className="form-control md:w-64">
                <div className="input-group">
                  <span className="bg-base-200">
                    <Filter className="size-5" />
                  </span>
                  <select
                    className="select select-bordered flex-1"
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                  >
                    <option value="">All Specialties</option>
                    {specialties.map((specialty) => (
                      <option key={specialty} value={specialty}>
                        {specialty}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        )}

        {/* Provider Grid */}
        {!isLoading && filteredProviders.length === 0 && (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body text-center py-20">
              <Heart className="size-16 mx-auto text-base-content/20 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Providers Found</h3>
              <p className="text-base-content/60">
                {searchTerm || selectedSpecialty
                  ? "Try adjusting your search criteria"
                  : "No providers are currently available"}
              </p>
            </div>
          </div>
        )}

        {!isLoading && filteredProviders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map((provider) => (
              <ProviderCard key={provider._id} provider={provider} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ProviderCard = ({ provider }) => {
  const profile = provider.healthcareProfile;

  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
      <div className="card-body">
        {/* Provider Avatar and Name */}
        <div className="flex items-start gap-4 mb-4">
          <div className="avatar">
            <div className="w-16 h-16 rounded-full">
              <img src={provider.profilePic || "/avatar.png"} alt={provider.fullName} />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="card-title text-lg">{provider.fullName}</h3>
            {profile?.providerType && (
              <p className="text-sm text-base-content/70 capitalize">{profile.providerType}</p>
            )}
          </div>
        </div>

        {/* Specialty */}
        {profile?.specialty && (
          <div className="flex items-center gap-2 mb-2">
            <Heart className="size-4 text-error" />
            <span className="text-sm font-medium">{profile.specialty}</span>
          </div>
        )}

        {/* License */}
        {profile?.licenseNumber && (
          <div className="text-sm text-base-content/60 mb-2">
            License: {profile.licenseNumber}
          </div>
        )}

        {/* Accepting New Patients */}
        {profile?.acceptsNewPatients && (
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="size-4 text-success" />
            <span className="text-sm text-success font-medium">Accepting New Patients</span>
          </div>
        )}

        {/* Bio */}
        {provider.bio && (
          <p className="text-sm text-base-content/70 mb-4 line-clamp-3">{provider.bio}</p>
        )}

        {/* Actions */}
        <div className="card-actions justify-end mt-4">
          <Link to={`/providers/${provider._id}`} className="btn btn-outline btn-sm">
            View Profile
          </Link>
          <Link to={`/book-appointment/${provider._id}`} className="btn btn-primary btn-sm">
            <Calendar className="size-4" />
            Book Appointment
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProviderDirectoryPage;
