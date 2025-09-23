"use client";

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase"; // adjust path if needed
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { Card } from "@/components/ui/card";

interface BatchEvent {
  id: string;
  eventType: string;
  timestamp: { toDate: () => Date };
  data: any;
  createdBy: string;
}

interface BatchTrackerProps {
  batchId: string;
}

export default function BatchTracker({ batchId }: BatchTrackerProps) {
  const [events, setEvents] = useState<BatchEvent[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "batches", batchId, "events"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const evts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as BatchEvent[];
      setEvents(evts);
    });

    return () => unsubscribe();
  }, [batchId]);

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Card
          key={event.id}
          className="p-4 border-l-4 shadow-sm rounded-xl bg-white"
        >
          <div className="flex items-center justify-between">
            <h5 className="font-semibold text-lg text-gray-800">
              {event.eventType}
            </h5>
            <span className="text-sm text-gray-500">
              {event.timestamp?.toDate().toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-2">
            By: {event.createdBy || "Unknown"}
          </p>

          {/* COLLECTION Event */}
          {event.eventType === "COLLECTION" && (
            <div className="bg-green-50 rounded-lg p-4">
              <h6 className="font-medium text-green-800 mb-2">
                Collection Details
              </h6>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Weight:</span>{" "}
                  {event.data?.weight ||
                    event.data?.collectedWeight ||
                    "N/A"} g
                </div>
                <div>
                  <span className="font-medium">Quality Grade:</span>{" "}
                  {event.data?.qualityGrade ||
                    event.data?.quality ||
                    event.data?.grade ||
                    "N/A"}
                </div>
                <div>
                  <span className="font-medium">Collector Group:</span>{" "}
                  {event.data?.collectorGroupName ||
                    event.data?.group ||
                    "N/A"}
                </div>
                <div>
                  <span className="font-medium">Weather:</span>{" "}
                  {event.data?.weather || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Harvest Date:</span>{" "}
                  {event.data?.harvestDate
                    ? new Date(event.data.harvestDate).toLocaleDateString()
                    : "N/A"}
                </div>
                <div>
                  <span className="font-medium">Zone:</span>{" "}
                  {event.data?.location?.zone ||
                    event.data?.zone ||
                    "N/A"}
                </div>
                <div>
                  <span className="font-medium">Price per Unit:</span>{" "}
                  {event.data?.pricePerUnit
                    ? `₹${event.data.pricePerUnit}`
                    : "N/A"}
                </div>
                <div>
                  <span className="font-medium">Total Price:</span>{" "}
                  {event.data?.totalPrice
                    ? `₹${event.data.totalPrice}`
                    : "N/A"}
                </div>
                <div>
                  <span className="font-medium">Moisture Level:</span>{" "}
                  {event.data?.moisture || "N/A"}
                </div>
                <div>
                  <span className="font-medium">GPS Location:</span>{" "}
                  {event.data?.gpsLocation ||
                    event.data?.location?.gps ||
                    "N/A"}
                </div>
                {event.data?.notes && (
                  <div className="col-span-2">
                    <span className="font-medium">Notes:</span>{" "}
                    {event.data.notes}
                  </div>
                )}
                {event.data?.images?.length > 0 && (
                  <div className="col-span-2">
                    <span className="font-medium">Images:</span>
                    <div className="flex gap-2 mt-2">
                      {event.data.images.map((img: string, idx: number) => (
                        <img
                          key={idx}
                          src={img}
                          alt="Collection"
                          className="w-20 h-20 object-cover rounded-md border"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROCESSING Event */}
          {event.eventType === "PROCESSING" && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h6 className="font-medium text-blue-800 mb-2">
                Processing Details
              </h6>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Method:</span>{" "}
                  {event.data?.method || event.data?.processingMethod || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Temperature:</span>{" "}
                  {event.data?.temperature
                    ? `${event.data.temperature}°C`
                    : "N/A"}
                </div>
                <div>
                  <span className="font-medium">Duration:</span>{" "}
                  {event.data?.duration
                    ? `${event.data.duration} hrs`
                    : "N/A"}
                </div>
                <div>
                  <span className="font-medium">Machinery Used:</span>{" "}
                  {event.data?.machinery || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Output Quantity:</span>{" "}
                  {event.data?.outputQuantity || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Supervisor:</span>{" "}
                  {event.data?.supervisor || "N/A"}
                </div>
                {event.data?.notes && (
                  <div className="col-span-2">
                    <span className="font-medium">Notes:</span>{" "}
                    {event.data.notes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MANUFACTURING Event */}
          {event.eventType === "MANUFACTURING" && (
            <div className="bg-purple-50 rounded-lg p-4">
              <h6 className="font-medium text-purple-800 mb-2">
                Manufacturing Details
              </h6>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Product:</span>{" "}
                  {event.data?.productName ||
                    event.data?.product ||
                    "N/A"}
                </div>
                <div>
                  <span className="font-medium">Batch Size:</span>{" "}
                  {event.data?.batchSize || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Expiry Date:</span>{" "}
                  {event.data?.expiryDate
                    ? new Date(event.data.expiryDate).toLocaleDateString()
                    : "N/A"}
                </div>
                <div>
                  <span className="font-medium">Certifications:</span>{" "}
                  {event.data?.certifications?.join(", ") || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Packaging:</span>{" "}
                  {event.data?.packaging || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Storage Conditions:</span>{" "}
                  {event.data?.storage || "N/A"}
                </div>
                {event.data?.notes && (
                  <div className="col-span-2">
                    <span className="font-medium">Notes:</span>{" "}
                    {event.data.notes}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
