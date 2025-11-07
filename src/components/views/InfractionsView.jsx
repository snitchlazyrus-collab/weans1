import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { INFRACTION_RULES } from '../../constants/infractionRules';

const InfractionsView = () => {
  const { users, infractions, postInfraction, setError } = useApp();
  const { currentUser } = useAuth();

  const handlePostInfraction = () => {
    const empId = document.getElementById('irEmpId').value;
    const ruleCode = document.getElementById('irRuleCode').value;
    const notes = document.getElementById('irAdditionalNotes').value;

    if (empId && ruleCode) {
      postInfraction(empId, ruleCode, notes, currentUser);
      document.getElementById('irEmpId').value = '';
      document.getElementById('irRuleCode').value = '';
      document.getElementById('irAdditionalNotes').value = '';
    } else {
      setError('Select employee and rule!');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">⚠️ Infraction Reports</h2>

      <div className="mb-6 p-4 bg-red-50 rounded-lg">
        <h3 className="font-bold mb-3">Create New Infraction Report</h3>

        <select
          id="irEmpId"
          className="w-full p-2 border rounded mb-2"
        >
          <option value="">Select Employee</option>
          {Object.entries(users).filter(([u, data]) => data.role !== 'admin').map(([username, data]) => (
            <option key={data.employeeId} value={data.employeeId}>
              {data.name} ({data.employeeId})
            </option>
          ))}
        </select>

        <select id="irRuleCode" className="w-full p-2 border rounded mb-2">
          <option value="">Select Infraction Rule</option>
          {Object.entries(INFRACTION_RULES)
            .filter(([code]) => !['MINOR', 'LESS_SERIOUS', 'SERIOUS'].includes(code))
            .map(([code, rule]) => (
              <option key={code} value={code}>
                {rule.rule} - Section {rule.section}: {rule.description.substring(0, 80)}...
              </option>
            ))}
        </select>

        <textarea
          id="irAdditionalNotes"
          placeholder="Additional notes/context (optional)..."
          className="w-full p-2 border rounded mb-2"
          rows="3"
        />

        <button
          onClick={handlePostInfraction}
          className="bg-red-500 text-white px-4 py-2 rounded font-bold hover:bg-red-600"
        >
          Issue Infraction Report
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-red-500 text-white">
              <th className="border p-2 text-left">Employee</th>
              <th className="border p-2 text-left">Rule</th>
              <th className="border p-2 text-left">Section</th>
              <th className="border p-2 text-left">Description</th>
              <th className="border p-2">Level</th>
              <th className="border p-2">Occurrence</th>
              <th className="border p-2">Ack</th>
              <th className="border p-2">Signed</th>
              <th className="border p-2 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {infractions.map(ir => {
              const employee = Object.values(users).find(u => u.employeeId === ir.employeeId);
              const employeeName = employee?.name || ir.employeeId;

              return (
                <tr key={ir.id} className={`hover:bg-red-50 ${
                  ir.level === 'Serious Infraction' ? 'bg-red-100' :
                  ir.level === 'Less Serious Infraction' ? 'bg-orange-50' :
                  'bg-yellow-50'
                }`}>
                  <td className="border p-2 font-semibold">{employeeName}</td>
                  <td className="border p-2 text-sm">{ir.rule}</td>
                  <td className="border p-2 text-center font-bold">{ir.section}</td>
                  <td className="border p-2 text-sm">
                    {ir.description}
                    {ir.additionalNotes && (
                      <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                        <strong>Notes:</strong> {ir.additionalNotes}
                      </div>
                    )}
                    {ir.comment && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                        <strong>Employee Comment:</strong> {ir.comment}
                      </div>
                    )}
                  </td>
                  <td className="border p-2 text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                      ir.level === 'Serious Infraction' ? 'bg-red-500 text-white' :
                      ir.level === 'Less Serious Infraction' ? 'bg-orange-500 text-white' :
                      'bg-yellow-500 text-white'
                    }`}>
                      {ir.level}
                    </span>
                  </td>
                  <td className="border p-2 text-center">
                    <span className="font-bold text-lg">
                      {ir.occurrenceCount}{ir.occurrenceCount === 1 ? 'st' : ir.occurrenceCount === 2 ? 'nd' : ir.occurrenceCount === 3 ? 'rd' : 'th'}
                    </span>
                  </td>
                  <td className="border p-2 text-center">
                    {ir.acknowledged ? (
                      <span className="text-green-600 font-bold text-2xl">✓</span>
                    ) : (
                      <span className="text-red-600 font-bold text-2xl">✗</span>
                    )}
                  </td>
                  <td className="border p-2 text-center">
                    {ir.signature ? (
                      <button
                        onClick={() => {
                          const win = window.open();
                          win.document.write(`<img src="${ir.signature}" />`);
                        }}
                        className="text-green-600 font-bold text-2xl hover:text-green-800"
                      >
                        ✓
                      </button>
                    ) : (
                      <span className="text-red-600 font-bold text-2xl">✗</span>
                    )}
                  </td>
                  <td className="border p-2 text-xs">
                    {new Date(ir.date).toLocaleDateString()}<br/>
                    {new Date(ir.date).toLocaleTimeString()}
                  </td>
                </tr>
              );
            })}
            {infractions.length === 0 && (
              <tr>
                <td colSpan="9" className="border p-8 text-center text-gray-500">
                  No infractions issued yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InfractionsView;
