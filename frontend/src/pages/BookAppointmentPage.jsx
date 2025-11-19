import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getRecommendedUsers, getProviderAvailability, createAppointment } from "../lib/api";
import toast from "react-hot-toast";
import { Calendar, Clock, ArrowLeft, CheckCircle } from "lucide-react";

const BookAppointmentPage = () => {
  const { providerId } = useParams();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [appointmentType, setAppointmentType] = useState("consultation");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [duration, setDuration] = useState(30);

  // Fetch provider details
  const { data: providerData, isLoading: providerLoading } = useQuery({
    queryKey: ["provider", providerId],
    queryFn: () => getRecommendedUsers({ userId: providerId }),
  });

  const provider = providerData?.users?.[0];

  // Fetch availability when date is selected
  const { data: availabilityData, isLoading: availabilityLoading } = useQuery({
    queryKey: ["availability", providerId, selectedDate],
    queryFn: () => getProviderAvailability(providerId, selectedDate),
    enabled: !!selectedDate,
  });

  const { mutate: bookAppointment, isPending } = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      toast.success("Appointment booked successfully!");
      navigate("/appointments");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to book appointment";
      toast.error(message);
    },
  });

  // Generate time slots based on availability
  const availableSlots = useMemo(() => {
    if (!availabilityData?.bookedSlots) return [];

    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    const slotDuration = duration; // minutes

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slotTime = new Date(selectedDate);
        slotTime.setHours(hour, minute, 0, 0);

        // Check if slot overlaps with booked appointments
        const isBooked = availabilityData.bookedSlots.some((booked) => {
          const bookedStart = new Date(booked.start);
          const bookedEnd = new Date(booked.end);
          const slotEnd = new Date(slotTime.getTime() + slotDuration * 60000);

          return (
            (slotTime >= bookedStart && slotTime < bookedEnd) ||
            (slotEnd > bookedStart && slotEnd <= bookedEnd) ||
            (slotTime <= bookedStart && slotEnd >= bookedEnd)
          );
        });

        if (!isBooked && slotTime > new Date()) {
          slots.push(slotTime);
        }
      }
    }

    return slots;
  }, [availabilityData, selectedDate, duration]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      toast.error("Please select a date and time");
      return;
    }

    const scheduledAt = new Date(`${selectedDate}T${selectedTime}`);

    bookAppointment({
      providerId,
      scheduledAt: scheduledAt.toISOString(),
      duration,
      appointmentType,
      chiefComplaint,
    });
  };

  // Get next 30 days for date picker
  const getNextDays = (count) => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < count; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const nextDays = getNextDays(30);

  if (providerLoading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h2 className="text-2xl font-bold mb-4">Provider Not Found</h2>
            <button onClick={() => navigate("/providers")} className="btn btn-primary">
              Back to Directory
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-4xl mx-auto p-6 py-12">
        {/* Back Button */}
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm mb-6">
          <ArrowLeft className="size-4" />
          Back
        </button>

        {/* Header */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <div className="flex items-center gap-4">
              <div className="avatar">
                <div className="w-16 h-16 rounded-full">
                  <img src={provider.profilePic || "/avatar.png"} alt={provider.fullName} />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold">{provider.fullName}</h1>
                <p className="text-base-content/70">
                  {provider.healthcareProfile?.specialty || provider.healthcareProfile?.providerType}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="card bg-base-100 shadow-xl">
          <div className="card-body space-y-6">
            <h2 className="card-title text-2xl">Book an Appointment</h2>

            {/* Appointment Type */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Appointment Type *</span>
              </label>
              <select
                className="select select-bordered"
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value)}
                required
              >
                <option value="consultation">Consultation</option>
                <option value="follow_up">Follow-up</option>
                <option value="initial_visit">Initial Visit</option>
                <option value="annual_checkup">Annual Checkup</option>
                <option value="urgent_care">Urgent Care</option>
              </select>
            </div>

            {/* Duration */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Duration *</span>
              </label>
              <select
                className="select select-bordered"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                required
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>

            {/* Date Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Select Date *</span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {nextDays.map((day) => {
                  const dateStr = day.toISOString().split("T")[0];
                  const isSelected = selectedDate === dateStr;
                  const isToday = dateStr === new Date().toISOString().split("T")[0];

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setSelectedTime("");
                      }}
                      className={`btn btn-sm ${
                        isSelected ? "btn-primary" : "btn-outline"
                      } flex-col h-auto py-2`}
                    >
                      <span className="text-xs">{day.toLocaleDateString("en", { weekday: "short" })}</span>
                      <span className="text-lg font-bold">{day.getDate()}</span>
                      {isToday && <span className="text-xs">Today</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Select Time *</span>
                </label>

                {availabilityLoading ? (
                  <div className="flex justify-center py-8">
                    <span className="loading loading-spinner loading-md"></span>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="alert alert-warning">
                    <span>No available slots for this date. Please select another date.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {availableSlots.map((slot) => {
                      const timeStr = slot.toTimeString().slice(0, 5);
                      const isSelected = selectedTime === timeStr;

                      return (
                        <button
                          key={timeStr}
                          type="button"
                          onClick={() => setSelectedTime(timeStr)}
                          className={`btn btn-sm ${isSelected ? "btn-primary" : "btn-outline"}`}
                        >
                          <Clock className="size-3" />
                          {slot.toLocaleTimeString("en", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Chief Complaint */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Reason for Visit</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                placeholder="Briefly describe your symptoms or reason for the appointment..."
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
              ></textarea>
              <label className="label">
                <span className="label-text-alt">Optional but helps the provider prepare</span>
              </label>
            </div>

            {/* Submit */}
            <div className="card-actions justify-end mt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-ghost"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isPending || !selectedDate || !selectedTime}
              >
                {isPending ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Booking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="size-4" />
                    Confirm Booking
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookAppointmentPage;
