import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { getMyAppointments, cancelAppointment, updateAppointment } from "../lib/api";
import toast from "react-hot-toast";
import { Calendar, Clock, Video, XCircle, CheckCircle, User, FileText } from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";

const AppointmentsPage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("upcoming");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const isProvider = authUser?.role === "provider" || authUser?.role === "admin";

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", filter],
    queryFn: () =>
      getMyAppointments({
        upcoming: filter === "upcoming",
        status: filter === "cancelled" ? "cancelled" : undefined,
      }),
  });

  const { mutate: cancel, isPending: isCancelling } = useMutation({
    mutationFn: ({ id, reason }) => cancelAppointment(id, reason),
    onSuccess: () => {
      toast.success("Appointment cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setSelectedAppointment(null);
      setCancelReason("");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to cancel appointment");
    },
  });

  const { mutate: confirmAppointment } = useMutation({
    mutationFn: (id) => updateAppointment(id, { status: "confirmed" }),
    onSuccess: () => {
      toast.success("Appointment confirmed");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to confirm appointment");
    },
  });

  const appointments = data?.appointments || [];

  const handleCancelClick = (appointment) => {
    setSelectedAppointment(appointment);
    document.getElementById("cancel_modal").showModal();
  };

  const handleCancelConfirm = () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }
    cancel({ id: selectedAppointment._id, reason: cancelReason });
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: "badge-warning",
      confirmed: "badge-info",
      in_progress: "badge-primary",
      completed: "badge-success",
      cancelled: "badge-error",
      no_show: "badge-error",
    };
    return colors[status] || "badge-ghost";
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {isProvider ? "My Schedule" : "My Appointments"}
          </h1>
          <p className="text-base-content/70">
            {isProvider
              ? "Manage your upcoming patient appointments"
              : "View and manage your healthcare appointments"}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="tabs tabs-boxed mb-6 bg-base-100 shadow-lg p-2">
          <button
            className={`tab ${filter === "upcoming" ? "tab-active" : ""}`}
            onClick={() => setFilter("upcoming")}
          >
            <Calendar className="size-4 mr-2" />
            Upcoming
          </button>
          <button
            className={`tab ${filter === "all" ? "tab-active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Appointments
          </button>
          <button
            className={`tab ${filter === "cancelled" ? "tab-active" : ""}`}
            onClick={() => setFilter("cancelled")}
          >
            <XCircle className="size-4 mr-2" />
            Cancelled
          </button>
        </div>

        {/* New Appointment Button */}
        {!isProvider && (
          <div className="mb-6">
            <Link to="/providers" className="btn btn-primary">
              <Calendar className="size-4" />
              Book New Appointment
            </Link>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && appointments.length === 0 && (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body text-center py-20">
              <Calendar className="size-16 mx-auto text-base-content/20 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Appointments</h3>
              <p className="text-base-content/60 mb-6">
                {filter === "upcoming"
                  ? "You don't have any upcoming appointments"
                  : filter === "cancelled"
                  ? "No cancelled appointments"
                  : "No appointments found"}
              </p>
              {!isProvider && (
                <Link to="/providers" className="btn btn-primary">
                  Book an Appointment
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Appointments List */}
        {!isLoading && appointments.length > 0 && (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
                isProvider={isProvider}
                onCancel={handleCancelClick}
                onConfirm={confirmAppointment}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="join">
              {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`join-item btn ${
                    page === data.pagination.currentPage ? "btn-active" : ""
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      <dialog id="cancel_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Cancel Appointment</h3>
          <p className="text-base-content/70 mb-4">
            Please provide a reason for cancelling this appointment:
          </p>
          <textarea
            className="textarea textarea-bordered w-full h-24 mb-4"
            placeholder="Reason for cancellation..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          ></textarea>
          <div className="modal-action">
            <button
              className="btn btn-ghost"
              onClick={() => {
                document.getElementById("cancel_modal").close();
                setCancelReason("");
                setSelectedAppointment(null);
              }}
              disabled={isCancelling}
            >
              Close
            </button>
            <button
              className="btn btn-error"
              onClick={handleCancelConfirm}
              disabled={isCancelling || !cancelReason.trim()}
            >
              {isCancelling ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Cancelling...
                </>
              ) : (
                "Confirm Cancellation"
              )}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

const AppointmentCard = ({ appointment, isProvider, onCancel, onConfirm }) => {
  const scheduledDate = new Date(appointment.scheduledAt);
  const isPast = scheduledDate < new Date();
  const canCancel =
    !isPast && ["scheduled", "confirmed"].includes(appointment.status);
  const canConfirm =
    isProvider && !isPast && appointment.status === "scheduled";

  const otherPerson = isProvider ? appointment.patient : appointment.provider;

  return (
    <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
      <div className="card-body">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          {/* Left: Avatar and Person Info */}
          <div className="flex items-center gap-4 flex-1">
            <div className="avatar">
              <div className="w-16 h-16 rounded-full">
                <img
                  src={otherPerson?.profilePic || "/avatar.png"}
                  alt={otherPerson?.fullName}
                />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{otherPerson?.fullName}</h3>
              <p className="text-sm text-base-content/70">
                {isProvider ? "Patient" : otherPerson?.healthcareProfile?.specialty}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`badge ${getStatusColor(appointment.status)}`}>
                  {appointment.status}
                </span>
                <span className="badge badge-outline capitalize">
                  {appointment.appointmentType?.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Date, Time, and Actions */}
          <div className="flex flex-col gap-3 md:text-right">
            <div className="flex items-center gap-2 md:justify-end">
              <Calendar className="size-4 text-primary" />
              <span className="font-medium">
                {scheduledDate.toLocaleDateString("en", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 md:justify-end">
              <Clock className="size-4 text-primary" />
              <span className="font-medium">
                {scheduledDate.toLocaleTimeString("en", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
              <span className="text-sm text-base-content/60">
                ({appointment.duration} min)
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-2 md:justify-end">
              {appointment.status === "confirmed" && !isPast && (
                <Link
                  to={`/call/appointment-${appointment._id}`}
                  className="btn btn-primary btn-sm"
                >
                  <Video className="size-4" />
                  Join Call
                </Link>
              )}
              {canConfirm && (
                <button
                  onClick={() => onConfirm(appointment._id)}
                  className="btn btn-success btn-sm"
                >
                  <CheckCircle className="size-4" />
                  Confirm
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => onCancel(appointment)}
                  className="btn btn-error btn-sm btn-outline"
                >
                  <XCircle className="size-4" />
                  Cancel
                </button>
              )}
              <Link
                to={`/appointments/${appointment._id}`}
                className="btn btn-ghost btn-sm"
              >
                <FileText className="size-4" />
                Details
              </Link>
            </div>
          </div>
        </div>

        {/* Chief Complaint */}
        {appointment.chiefComplaint && (
          <div className="mt-4 pt-4 border-t border-base-300">
            <p className="text-sm font-medium text-base-content/60 mb-1">Reason for Visit:</p>
            <p className="text-sm">{appointment.chiefComplaint}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;
